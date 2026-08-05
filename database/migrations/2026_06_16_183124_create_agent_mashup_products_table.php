<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agent_mashup_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('agent_shop_id')->constrained()->onDelete('cascade');
            $table->foreignId('mashup_package_id')->constrained()->onDelete('cascade');
            $table->decimal('agent_price', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['agent_shop_id', 'mashup_package_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agent_mashup_products');
    }
};
