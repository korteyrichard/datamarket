<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true) . ' Data',
            'price' => fake()->randomFloat(2, 10, 100),
            'description' => fake()->sentence(),
            'network' => fake()->randomElement(['MTN', 'Telecel', 'AirtelTigo']),
            'expiry' => fake()->numberBetween(1, 30) . ' days',
            'quantity' => fake()->numberBetween(1, 100),
            'status' => 'active',
            'product_type' => 'data'
        ];
    }
}