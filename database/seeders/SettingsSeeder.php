<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        Setting::updateOrCreate(
            ['key' => 'api_enabled'],
            ['value' => 'true']
        );

        Setting::updateOrCreate(
            ['key' => 'codecraft_mtn_api_enabled'],
            ['value' => 'false']
        );
    }
}