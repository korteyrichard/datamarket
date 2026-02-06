<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->enum('payment_method', ['mobile_money'])->default('mobile_money')->after('amount');
            $table->enum('network', ['mtn', 'telecel'])->after('payment_method');
            $table->string('mobile_money_account_name')->after('network');
            $table->string('mobile_money_number')->after('mobile_money_account_name');
        });
    }

    public function down(): void
    {
        Schema::table('withdrawals', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'network', 'mobile_money_account_name', 'mobile_money_number']);
        });
    }
};