<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Property extends Model
{
    protected $fillable = [
        'canonical_code', 'property_type', 'title', 'description',
        'land_rai', 'land_ngan', 'land_sqwah', 'building_area_sqm',
        'address_text', 'province_code', 'province_name', 'district_code',
        'district_name', 'subdistrict_code', 'subdistrict_name',
        'latitude', 'longitude', 'verification_status',
    ];

    public function auctionEvents(): HasMany
    {
        return $this->hasMany(AuctionEvent::class);
    }

    public function sourceRecords(): HasMany
    {
        return $this->hasMany(SourceRecord::class);
    }
}
