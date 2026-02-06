<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            if (!Schema::hasColumn('carts', 'agent_id')) {
                $table->unsignedBigInteger('agent_id')->nullable()->after('user_id');
                $table->foreign('agent_id')->references('id')->on('users')->onDelete('set null');
            }
            if (!Schema::hasColumn('carts', 'price')) {
                $table->decimal('price', 10, 2)->nullable()->after('quantity');
            }
        });
    }

    public function down(): void
    {
        Schema::table('carts', function (Blueprint $table) {
            $table->dropForeign(['agent_id']);
            $table->dropColumn(['agent_id', 'price']);
        });
    }
};