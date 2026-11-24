<?php

namespace App\Console\Commands;

use App\Services\LedOpenDataClient;
use Illuminate\Console\Command;
use Throwable;

class TestLedOpenDataApi extends Command
{
    protected $signature = 'led:open-data-test
        {package=led_it_0002 : CKAN package ID or name}
        {resource=a7414d95-b70a-43a7-9af6-a9f4cdc793e4 : CKAN resource UUID}
        {--limit=5 : Number of DataStore rows to request (1-100)}';

    protected $description = 'Check LED CKAN package, resource metadata and DataStore API access.';

    public function handle(LedOpenDataClient $client): int
    {
        $packageId = (string) $this->argument('package');
        $resourceId = (string) $this->argument('resource');
        $limit = (int) $this->option('limit');

        $this->info('LED Open Data API smoke test');
        $this->line('Package: ' . $packageId);
        $this->line('Resource: ' . $resourceId);

        try {
            $package = $client->packageShow($packageId);
            $this->info('PASS package_show');
            $this->line('Title: ' . ($package['title'] ?? '(not supplied)'));
            $this->line('License: ' . ($package['license_title'] ?? '(not supplied)'));
        } catch (Throwable $e) {
            $this->error('FAIL package_show: ' . $e->getMessage());
            return self::FAILURE;
        }

        try {
            $resource = $client->resourceShow($resourceId);
            $this->info('PASS resource_show');
            $this->line('Resource name: ' . ($resource['name'] ?? '(not supplied)'));
            $this->line('Format: ' . ($resource['format'] ?? '(not supplied)'));
            $this->line('DataStore active: ' . (!empty($resource['datastore_active']) ? 'yes' : 'no'));
            $this->line('Last modified: ' . ($resource['last_modified'] ?? '(not supplied)'));
        } catch (Throwable $e) {
            $this->warn('resource_show could not be verified: ' . $e->getMessage());
            return self::FAILURE;
        }

        try {
            $data = $client->datastoreSearch($resourceId, $limit);
            $records = $data['records'] ?? [];
            $this->info('PASS datastore_search');
            $this->line('Total rows reported: ' . ($data['total'] ?? 'unknown'));
            $this->line('Rows returned: ' . count($records));
            if ($records !== []) {
                $this->line('First row:');
                $this->line(json_encode($records[0], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            }
        } catch (Throwable $e) {
            $this->warn('datastore_search unavailable or not enabled for this resource: ' . $e->getMessage());
            $this->line('Fallback: download the published CSV resource and import it through the approved CSV pipeline.');
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}
