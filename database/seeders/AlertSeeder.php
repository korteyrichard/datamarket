<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Alert;
use Carbon\Carbon;

class AlertSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Alert::create([
            'title' => 'Welcome to SupaData!',
            'message' => 'Thank you for using our platform. Enjoy fast and reliable data services.',
            'type' => 'success',
            'is_active' => true,
            'expires_at' => null
        ]);

        Alert::create([
            'title' => 'System Maintenance',
            'message' => 'We will be performing scheduled maintenance on Sunday from 2:00 AM to 4:00 AM. Some services may be temporarily unavailable.',
            'type' => 'warning',
            'is_active' => true,
            'expires_at' => Carbon::now()->addDays(7)
        ]);

        Alert::create([
            'title' => 'New Features Available',
            'message' => 'Check out our new API documentation and enhanced transaction tracking features!',
            'type' => 'info',
            'is_active' => true,
            'expires_at' => Carbon::now()->addDays(30)
        ]);
    }
}
