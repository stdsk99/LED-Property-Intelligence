<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class LedOpenDataClient
{
    public function __construct(
        private readonly string $baseUrl = 'https://opendata.led.go.th/api/3/action',
        private readonly int $timeout = 20,
    ) {}

    public function packageShow(string $id): array
    {
        return $this->action('package_show', ['id' => $id]);
    }

    public function resourceShow(string $resourceId): array
    {
        return $this->action('resource_show', ['id' => $resourceId]);
    }

    public function datastoreSearch(string $resourceId, int $limit = 5, int $offset = 0): array
    {
        if ($limit < 1 || $limit > 100 || $offset < 0) {
            throw new RuntimeException('Invalid DataStore pagination: limit must be 1-100 and offset must be >= 0.');
        }

        return $this->action('datastore_search', [
            'resource_id' => $resourceId,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    private function action(string $action, array $query): array
    {
        $url = rtrim($this->baseUrl, '/') . '/' . $action;

        $response = Http::acceptJson()
            ->timeout($this->timeout)
            ->retry(2, 500, throw: false)
            ->get($url, $query);

        if (!$response->successful()) {
            throw new RuntimeException(sprintf(
                'LED Open Data API %s failed with HTTP %d: %s',
                $action,
                $response->status(),
                mb_substr($response->body(), 0, 500)
            ));
        }

        $json = $response->json();

        if (!is_array($json) || !Arr::get($json, 'success', false)) {
            throw new RuntimeException(sprintf(
                'LED Open Data API %s returned an invalid or unsuccessful CKAN response.',
                $action
            ));
        }

        $result = Arr::get($json, 'result');

        if (!is_array($result)) {
            throw new RuntimeException(sprintf('LED Open Data API %s returned no result object.', $action));
        }

        return $result;
    }
}
