<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->enum('status', ['pending', 'processing', 'approved', 'rejected', 'paid'])->default('pending')->after('mobile_money_number');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn('status');
        });
        
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending')->after('mobile_money_number');
        });
    }
};