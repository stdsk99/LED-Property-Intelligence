<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use SplFileObject;

class LedOpenDataCsvImporter
{
    /**
     * Import an LED Open Data CSV while preserving the original row.
     *
     * Header aliases are deliberately explicit and conservative. If the official
     * CSV uses different headers, extend the alias lists after inspecting the file.
     */
    public function import(
        string $path,
        string $datasetId,
        ?string $resourceId = null,
        ?string $sourceUrl = null,
        ?string $license = 'CC BY-NC',
        ?string $sourceUpdatedAt = null
    ): array {
        if (!is_file($path) || !is_readable($path)) {
            throw new RuntimeException('CSV file does not exist or is not readable: ' . $path);
        }

        $file = new SplFileObject($path, 'r');
        $file->setFlags(SplFileObject::READ_CSV | SplFileObject::SKIP_EMPTY);
        $headers = $file->fgetcsv();

        if (!is_array($headers) || count($headers) < 2) {
            throw new RuntimeException('CSV header row is missing or invalid.');
        }

        $headers = array_map(fn ($v) => $this->cleanHeader((string) $v), $headers);
        $count = 0;
        $skipped = 0;
        $batch = [];

        while (!$file->eof()) {
            $values = $file->fgetcsv();
            if (!is_array($values) || $values === [null]) {
                continue;
            }

            $row = [];
            foreach ($headers as $index => $header) {
                if ($header === '') {
                    continue;
                }
                $row[$header] = $values[$index] ?? null;
            }

            if (count(array_filter($row, fn ($v) => $v !== null && trim((string) $v) !== '')) === 0) {
                continue;
            }

            $fiscalYear = $this->findValue($row, ['fiscal year', 'fiscal_year', 'ปีงบประมาณ']);
            $month = $this->findValue($row, ['month', 'เดือน']);
            $assetType = $this->findValue($row, ['type', 'asset type', 'ประเภททรัพย์', 'ประเภททรัพย์สิน']);
            $value = $this->findValue($row, ['value', 'จำนวน', 'จำนวนทรัพย์']);
            $price = $this->findValue($row, ['price', 'ราคาประเมิน', 'มูลค่าประเมิน']);

            $rawJson = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
            if ($rawJson === false) {
                $skipped++;
                continue;
            }

            $batch[] = [
                'dataset_id' => $datasetId,
                'resource_id' => $resourceId,
                'source_row_hash' => hash('sha256', $datasetId . '|' . $rawJson),
                'fiscal_year' => $this->nullableInteger($fiscalYear),
                'month' => $this->nullableInteger($month),
                'asset_type' => $assetType !== null ? trim((string) $assetType) : null,
                'property_count' => $this->nullableDecimal($value),
                'appraisal_value' => $this->nullableDecimal($price),
                'raw_payload' => $rawJson,
                'source_license' => $license,
                'source_url' => $sourceUrl,
                'source_updated_at' => $sourceUpdatedAt,
                'retrieved_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) >= 250) {
                $count += $this->writeBatch($batch);
                $batch = [];
            }
        }

        if ($batch !== []) {
            $count += $this->writeBatch($batch);
        }

        return ['processed' => $count, 'skipped' => $skipped];
    }

    private function writeBatch(array $rows): int
    {
        DB::table('led_open_data_rows')->upsert(
            $rows,
            ['dataset_id', 'source_row_hash'],
            ['resource_id', 'fiscal_year', 'month', 'asset_type', 'property_count',
                'appraisal_value', 'raw_payload', 'source_license', 'source_url',
                'source_updated_at', 'retrieved_at', 'updated_at']
        );

        return count($rows);
    }

    private function cleanHeader(string $value): string
    {
        $value = preg_replace('/^\xEF\xBB\xBF/', '', $value) ?? $value;
        return trim($value, " \t\n\r\0\x0B\"");
    }

    private function findValue(array $row, array $aliases): mixed
    {
        foreach ($aliases as $alias) {
            foreach ($row as $key => $value) {
                if (mb_strtolower(trim((string) $key)) === mb_strtolower($alias)) {
                    return $value;
                }
            }
        }
        return null;
    }

    private function nullableInteger(mixed $value): ?int
    {
        $number = $this->nullableDecimal($value);
        return $number === null ? null : (int) $number;
    }

    private function nullableDecimal(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }

        $normalized = str_replace([',', ' ', '฿'], '', trim((string) $value));
        if ($normalized === '' || !is_numeric($normalized)) {
            return null;
        }

        return (float) $normalized;
    }
}
