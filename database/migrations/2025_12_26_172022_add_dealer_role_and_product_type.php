<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Update products table to include dealer_product type
        Schema::table('products', function (Blueprint $table) {
            $table->string('product_type')->default('customer_product')->change();
        });
        
        // Add dealer_product as a valid product type
        DB::statement("ALTER TABLE products MODIFY COLUMN product_type ENUM('customer_product', 'agent_product', 'dealer_product') DEFAULT 'customer_product'");
    }

    public function down(): void
    {
        // Revert product_type enum to original values
        DB::statement("ALTER TABLE products MODIFY COLUMN product_type ENUM('customer_product', 'agent_product') DEFAULT 'customer_product'");
    }
};