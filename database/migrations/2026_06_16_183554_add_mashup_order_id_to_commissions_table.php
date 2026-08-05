<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            // Drop existing foreign key and make order_id nullable
            $table->dropForeign(['order_id']);
            $table->unsignedBigInteger('order_id')->nullable()->change();
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');

            $table->unsignedBigInteger('mashup_order_id')->nullable()->after('order_id');
            $table->foreign('mashup_order_id')->references('id')->on('mashup_orders')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('commissions', function (Blueprint $table) {
            $table->dropForeign(['mashup_order_id']);
            $table->dropColumn('mashup_order_id');

            $table->dropForeign(['order_id']);
            $table->unsignedBigInteger('order_id')->nullable(false)->change();
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
        });
    }
};
