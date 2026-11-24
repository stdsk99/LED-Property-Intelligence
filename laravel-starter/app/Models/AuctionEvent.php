<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class AuctionEvent extends Model
{
    protected $fillable = ['property_id', 'scheduled_at', 'round_number', 'opening_price', 'deposit_amount', 'status', 'venue', 'channel', 'last_verified_at'];
    protected $casts = ['scheduled_at' => 'datetime', 'last_verified_at' => 'datetime', 'opening_price' => 'decimal:2', 'deposit_amount' => 'decimal:2'];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
