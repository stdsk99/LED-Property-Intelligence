<?php

namespace App\Console\Commands;

use App\Services\LedOpenDataCsvImporter;
use Illuminate\Console\Command;
use Throwable;

class ImportLedOpenDataCsv extends Command
{
    protected $signature = 'led:open-data-import-csv
        {path : Absolute or relative path to the downloaded CSV}
        {--dataset=led_it_0002 : CKAN dataset ID}
        {--resource=a7414d95-b70a-43a7-9af6-a9f4cdc793e4 : CKAN resource UUID}
        {--source-url=https://opendata.led.go.th/dataset/led_it_0002/resource/a7414d95-b70a-43a7-9af6-a9f4cdc793e4 : Source resource page URL}
        {--license=CC BY-NC : License label shown by the source metadata}';

    protected $description = 'Import an authorized LED Open Data CSV and preserve raw source rows.';

    public function handle(LedOpenDataCsvImporter $importer): int
    {
        try {
            $result = $importer->import(
                (string) $this->argument('path'),
                (string) $this->option('dataset'),
                (string) $this->option('resource'),
                (string) $this->option('source-url'),
                (string) $this->option('license')
            );

            $this->info('LED Open Data CSV import completed.');
            $this->line('Rows processed: ' . $result['processed']);
            $this->line('Rows skipped: ' . $result['skipped']);
            $this->warn('Review the CSV header mapping and source license before using values in commercial analytics.');

            return self::SUCCESS;
        } catch (Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }
    }
}
