<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
    ['id' => 1, 'name' => '1GB MTN', 'network' => 'MTN', 'price' => 5.00, 'description' => 'MTN Non Expiry 1GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '1GB', 'status' => 'IN STOCK'],
    ['id' => 2, 'name' => '2GB MTN', 'network' => 'MTN', 'price' => 10.00, 'description' => 'MTN Non Expiry 2GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '2GB', 'status' => 'IN STOCK'],
    ['id' => 3, 'name' => '3GB MTN', 'network' => 'MTN', 'price' => 15.00, 'description' => 'MTN Non Expiry 3GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '3GB', 'status' => 'IN STOCK'],
    ['id' => 4, 'name' => '4GB MTN', 'network' => 'MTN', 'price' => 20.00, 'description' => 'MTN Non Expiry 4GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '4GB', 'status' => 'IN STOCK'],
    ['id' => 5, 'name' => '5GB MTN', 'network' => 'MTN', 'price' => 24.00, 'description' => 'MTN Non Expiry 5GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '5GB', 'status' => 'IN STOCK'],
    ['id' => 6, 'name' => '6GB MTN', 'network' => 'MTN', 'price' => 29.00, 'description' => 'MTN Non Expiry 6GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '6GB', 'status' => 'IN STOCK'],
    ['id' => 7, 'name' => '8GB MTN', 'network' => 'MTN', 'price' => 39.00, 'description' => 'MTN Non Expiry 8GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '8GB', 'status' => 'IN STOCK'],
    ['id' => 8, 'name' => '10GB MTN', 'network' => 'MTN', 'price' => 47.00, 'description' => 'MTN Non Expiry 10GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '10GB', 'status' => 'IN STOCK'],
    ['id' => 9, 'name' => '15GB MTN', 'network' => 'MTN', 'price' => 65.00, 'description' => 'MTN Non Expiry 15GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '15GB', 'status' => 'IN STOCK'],
    ['id' => 10, 'name' => '20GB MTN', 'network' => 'MTN', 'price' => 85.00, 'description' => 'MTN Non Expiry 20GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '20GB', 'status' => 'IN STOCK'],
    ['id' => 11, 'name' => '25GB MTN', 'network' => 'MTN', 'price' => 105.00, 'description' => 'MTN Non Expiry 25GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '25GB', 'status' => 'IN STOCK'],
    ['id' => 12, 'name' => '30GB MTN', 'network' => 'MTN', 'price' => 128.00, 'description' => 'MTN Non Expiry 30GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '30GB', 'status' => 'IN STOCK'],
    ['id' => 13, 'name' => '40GB MTN', 'network' => 'MTN', 'price' => 169.00, 'description' => 'MTN Non Expiry 40GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '40GB', 'status' => 'IN STOCK'],
    ['id' => 14, 'name' => '50GB MTN', 'network' => 'MTN', 'price' => 215.00, 'description' => 'MTN Non Expiry 50GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '50GB', 'status' => 'IN STOCK'],
    ['id' => 15, 'name' => '100GB MTN', 'network' => 'MTN', 'price' => 425.00, 'description' => 'MTN Non Expiry 100GB Data Bundle', 'expiry' => 'non expiry', 'quantity' => '100GB', 'status' => 'IN STOCK'],

    ['id' => 16, 'name' => '1GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 5.00, 'description' => 'AT Data (Instant) 24 Hours 1GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '1GB', 'status' => 'IN STOCK'],
    ['id' => 17, 'name' => '2GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 10.00, 'description' => 'AT Data (Instant) 24 Hours 2GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '2GB', 'status' => 'IN STOCK'],
    ['id' => 18, 'name' => '3GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 15.00, 'description' => 'AT Data (Instant) 24 Hours 3GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '3GB', 'status' => 'IN STOCK'],
    ['id' => 19, 'name' => '4GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 19.00, 'description' => 'AT Data (Instant) 24 Hours 4GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '4GB', 'status' => 'IN STOCK'],
    ['id' => 20, 'name' => '5GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 24.00, 'description' => 'AT Data (Instant) 24 Hours 5GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '5GB', 'status' => 'IN STOCK'],
    ['id' => 21, 'name' => '6GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 24.00, 'description' => 'AT Data (Instant) 24 Hours 6GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '6GB', 'status' => 'IN STOCK'],
    ['id' => 22, 'name' => '8GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 37.00, 'description' => 'AT Data (Instant) 24 Hours 8GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '8GB', 'status' => 'IN STOCK'],
    ['id' => 23, 'name' => '10GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 45.00, 'description' => 'AT Data (Instant) 24 Hours 10GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '10GB', 'status' => 'IN STOCK'],
    ['id' => 24, 'name' => '12GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 50.00, 'description' => 'AT Data (Instant) 24 Hours 12GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '12GB', 'status' => 'IN STOCK'],
    ['id' => 25, 'name' => '15GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 70.00, 'description' => 'AT Data (Instant) 24 Hours 15GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '15GB', 'status' => 'IN STOCK'],
    ['id' => 26, 'name' => '20GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 85.00, 'description' => 'AT Data (Instant) 24 Hours 20GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '20GB', 'status' => 'IN STOCK'],
    ['id' => 27, 'name' => '25GB AT Data (Instant)', 'network' => 'AT Data (Instant)', 'price' => 120.00, 'description' => 'AT Data (Instant) 24 Hours 25GB Data Bundle', 'expiry' => '24 hours', 'quantity' => '25GB', 'status' => 'IN STOCK'],

    ['id' => 28, 'name' => '20GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 70.00, 'description' => 'AT (Big Packages) 30 Days 20GB Data Bundle', 'expiry' => '30 days', 'quantity' => '20GB', 'status' => 'IN STOCK'],
    ['id' => 29, 'name' => '30GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 75.00, 'description' => 'AT (Big Packages) 30 Days 30GB Data Bundle', 'expiry' => '30 days', 'quantity' => '30GB', 'status' => 'IN STOCK'],
    ['id' => 30, 'name' => '40GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 87.00, 'description' => 'AT (Big Packages) 30 Days 40GB Data Bundle', 'expiry' => '30 days', 'quantity' => '40GB', 'status' => 'IN STOCK'],
    ['id' => 31, 'name' => '50GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 100.00, 'description' => 'AT (Big Packages) 30 Days 50GB Data Bundle', 'expiry' => '30 days', 'quantity' => '50GB', 'status' => 'IN STOCK'],
    ['id' => 32, 'name' => '60GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 125.00, 'description' => 'AT (Big Packages) 30 Days 60GB Data Bundle', 'expiry' => '30 days', 'quantity' => '60GB', 'status' => 'IN STOCK'],
    ['id' => 33, 'name' => '70GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 155.00, 'description' => 'AT (Big Packages) 30 Days 70GB Data Bundle', 'expiry' => '30 days', 'quantity' => '70GB', 'status' => 'IN STOCK'],
    ['id' => 34, 'name' => '80GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 155.00, 'description' => 'AT (Big Packages) 30 Days 80GB Data Bundle', 'expiry' => '30 days', 'quantity' => '80GB', 'status' => 'IN STOCK'],
    ['id' => 35, 'name' => '90GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 166.00, 'description' => 'AT (Big Packages) 30 Days 90GB Data Bundle', 'expiry' => '30 days', 'quantity' => '90GB', 'status' => 'IN STOCK'],
    ['id' => 36, 'name' => '100GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 180.00, 'description' => 'AT (Big Packages) 30 Days 100GB Data Bundle', 'expiry' => '30 days', 'quantity' => '100GB', 'status' => 'IN STOCK'],
    ['id' => 37, 'name' => '200GB AT (Big Packages)', 'network' => 'AT (Big Packages)', 'price' => 347.00, 'description' => 'AT (Big Packages) 30 Days 200GB Data Bundle', 'expiry' => '30 days', 'quantity' => '200GB', 'status' => 'IN STOCK'],

    ['id' => 38, 'name' => '5GB TELECEL', 'network' => 'TELECEL', 'price' => 22.00, 'description' => 'TELECEL 30 Days 5GB Data Bundle', 'expiry' => '30 days', 'quantity' => '5GB', 'status' => 'IN STOCK'],
    ['id' => 39, 'name' => '10GB TELECEL', 'network' => 'TELECEL', 'price' => 45.00, 'description' => 'TELECEL 30 Days 10GB Data Bundle', 'expiry' => '30 days', 'quantity' => '10GB', 'status' => 'IN STOCK'],
    ['id' => 40, 'name' => '20GB TELECEL', 'network' => 'TELECEL', 'price' => 85.00, 'description' => 'TELECEL 30 Days 20GB Data Bundle', 'expiry' => '30 days', 'quantity' => '20GB', 'status' => 'IN STOCK'],
    ['id' => 41, 'name' => '25GB TELECEL', 'network' => 'TELECEL', 'price' => 100.00, 'description' => 'TELECEL 30 Days 25GB Data Bundle', 'expiry' => '30 days', 'quantity' => '25GB', 'status' => 'IN STOCK'],
    ['id' => 42, 'name' => '30GB TELECEL', 'network' => 'TELECEL', 'price' => 125.00, 'description' => 'TELECEL 30 Days 30GB Data Bundle', 'expiry' => '30 days', 'quantity' => '30GB', 'status' => 'IN STOCK'],
    ['id' => 43, 'name' => '40GB TELECEL', 'network' => 'TELECEL', 'price' => 158.00, 'description' => 'TELECEL 30 Days 40GB Data Bundle', 'expiry' => '30 days', 'quantity' => '40GB', 'status' => 'IN STOCK'],
    ['id' => 44, 'name' => '50GB TELECEL', 'network' => 'TELECEL', 'price' => 195.00, 'description' => 'TELECEL 30 Days 50GB Data Bundle', 'expiry' => '30 days', 'quantity' => '50GB', 'status' => 'IN STOCK'],
    ['id' => 45, 'name' => '100GB TELECEL', 'network' => 'TELECEL', 'price' => 380.00, 'description' => 'TELECEL 30 Days 100GB Data Bundle', 'expiry' => '30 days', 'quantity' => '100GB', 'status' => 'IN STOCK'],
];

        foreach ($products as $productData) {
            Product::updateOrCreate(
                ['id' => $productData['id']],
                $productData
            );
        }
    }
}
