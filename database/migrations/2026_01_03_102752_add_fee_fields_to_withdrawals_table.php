<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->decimal('requested_amount', 10, 2)->after('agent_id');
            $table->decimal('fee_amount', 10, 2)->default(0)->after('requested_amount');
            // Rename existing amount to final_amount for clarity
        });
        
        // Update existing records to have requested_amount = amount
        DB::statement('UPDATE withdrawals SET requested_amount = amount, fee_amount = 0');
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn(['requested_amount', 'fee_amount']);
        });
    }
};