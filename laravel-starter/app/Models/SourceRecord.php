<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;

class SourceRecord extends Model
{
    protected $fillable = ['property_id', 'data_source_id', 'import_batch_id', 'source_record_key', 'source_url', 'source_published_at', 'fetched_at', 'raw_payload', 'normalized_hash', 'match_status'];
    protected $casts = ['raw_payload' => 'array', 'source_published_at' => 'datetime', 'fetched_at' => 'datetime'];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
