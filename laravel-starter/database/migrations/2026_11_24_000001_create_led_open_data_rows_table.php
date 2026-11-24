<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('led_open_data_rows', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('dataset_id', 150);
            $table->string('resource_id', 80)->nullable();
            $table->string('source_row_hash', 64);
            $table->unsignedSmallInteger('fiscal_year')->nullable();
            $table->unsignedTinyInteger('month')->nullable();
            $table->string('asset_type', 255)->nullable();
            $table->decimal('property_count', 18, 2)->nullable();
            $table->decimal('appraisal_value', 20, 2)->nullable();
            $table->json('raw_payload');
            $table->string('source_license', 100)->nullable();
            $table->string('source_url', 2048)->nullable();
            $table->timestamp('source_updated_at')->nullable();
            $table->timestamp('retrieved_at');
            $table->timestamps();

            $table->unique(['dataset_id', 'source_row_hash'], 'led_open_data_dataset_row_unique');
            $table->index(['dataset_id', 'fiscal_year', 'month'], 'led_open_data_period_idx');
            $table->index(['dataset_id', 'asset_type'], 'led_open_data_type_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('led_open_data_rows');
    }
};
