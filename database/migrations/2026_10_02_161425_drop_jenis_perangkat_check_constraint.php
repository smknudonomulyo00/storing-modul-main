<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public $withinTransaction = false;

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the CockroachDB CHECK constraint that was created when enum was used
        try {
            DB::statement("ALTER TABLE moduls DROP CONSTRAINT IF EXISTS check_jenis_perangkat");
        } catch (\Exception $e) {
            // Ignore if it doesn't exist
        }
        
        // Also just in case it has a different generated name like moduls_jenis_perangkat_check
        try {
            DB::statement("ALTER TABLE moduls DROP CONSTRAINT IF EXISTS moduls_jenis_perangkat_check");
        } catch (\Exception $e) {
            // Ignore
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 
    }
};
