<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PropertyController
{
    public function index(Request $request): JsonResponse
    {
        // TODO: Implement validated filters, pagination, organization-aware access,
        // source freshness, and property visibility rules.
        return response()->json([
            'data' => [],
            'meta' => [
                'message' => 'Property search endpoint scaffolded; implementation pending.',
                'filters' => $request->only(['q', 'province_code', 'property_type', 'min_price', 'max_price', 'auction_from', 'auction_to']),
            ],
        ]);
    }
}
