<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mashup_orders', function (Blueprint $table) {
            $table->string('paystack_reference')->nullable()->unique()->after('status');
            $table->string('customer_email')->nullable()->after('paystack_reference');
            $table->foreignId('user_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('mashup_orders', function (Blueprint $table) {
            $table->dropColumn(['paystack_reference', 'customer_email']);
            $table->foreignId('user_id')->nullable(false)->change();
        });
    }
};
