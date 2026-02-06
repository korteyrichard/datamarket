<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agent_shops', function (Blueprint $table) {
            $table->string('color', 7)->default('#3B82F6')->after('is_active'); // Default blue color
        });
    }

    public function down(): void
    {
        Schema::table('agent_shops', function (Blueprint $table) {
            $table->dropColumn('color');
        });
    }
};