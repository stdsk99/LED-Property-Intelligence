<?php

namespace App\\Http\\Controllers\\Api;

use Illuminate\\Http\\JsonResponse;

class HealthController
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'service' => 'LED Property Intelligence API',
            'status' => 'ok',
            'version' => '1.0.0',
        ]);
    }
}
