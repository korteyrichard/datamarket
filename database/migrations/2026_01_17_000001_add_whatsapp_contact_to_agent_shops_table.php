<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('agent_shops', function (Blueprint $table) {
            $table->string('whatsapp_contact', 15)->nullable()->after('color');
        });
    }

    public function down(): void
    {
        Schema::table('agent_shops', function (Blueprint $table) {
            $table->dropColumn('whatsapp_contact');
        });
    }
};