<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE products MODIFY COLUMN product_type ENUM('customer_product', 'agent_product', 'dealer_product', 'elite_product') DEFAULT 'customer_product'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE products MODIFY COLUMN product_type ENUM('customer_product', 'agent_product', 'dealer_product') DEFAULT 'customer_product'");
    }
};
