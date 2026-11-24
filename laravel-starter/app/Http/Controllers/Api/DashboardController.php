<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;

class DashboardController
{
    public function summary(): JsonResponse
    {
        // TODO: Scope all aggregates to the authenticated user's active organization.
        return response()->json([
            'data' => [
                'properties_count' => null,
                'upcoming_auctions_count' => null,
                'valuation_coverage_percent' => null,
                'opportunity_candidates_count' => null,
            ],
            'meta' => ['message' => 'Dashboard aggregates pending database implementation.'],
        ]);
    }
}
