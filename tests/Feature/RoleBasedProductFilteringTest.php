<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleBasedProductFilteringTest extends TestCase
{
    use RefreshDatabase;

    public function test_customers_see_only_customer_products()
    {
        // Create products for different roles
        $customerProduct = Product::factory()->create([
            'product_type' => 'customer_product',
            'status' => 'IN STOCK'
        ]);
        $agentProduct = Product::factory()->create([
            'product_type' => 'agent_product',
            'status' => 'IN STOCK'
        ]);
        $dealerProduct = Product::factory()->create([
            'product_type' => 'dealer_product',
            'status' => 'IN STOCK'
        ]);

        // Create customer user
        $customer = User::factory()->create(['role' => 'customer']);

        // Act as customer and visit dashboard
        $response = $this->actingAs($customer)->get('/dashboard');

        $response->assertStatus(200);
        
        // Check that only customer products are visible
        $products = $response->viewData('products');
        $this->assertCount(1, $products);
        $this->assertEquals('customer_product', $products->first()->product_type);
    }

    public function test_agents_see_only_agent_products()
    {
        // Create products for different roles
        $customerProduct = Product::factory()->create([
            'product_type' => 'customer_product',
            'status' => 'IN STOCK'
        ]);
        $agentProduct = Product::factory()->create([
            'product_type' => 'agent_product',
            'status' => 'IN STOCK'
        ]);
        $dealerProduct = Product::factory()->create([
            'product_type' => 'dealer_product',
            'status' => 'IN STOCK'
        ]);

        // Create agent user
        $agent = User::factory()->create(['role' => 'agent']);

        // Act as agent and visit dashboard
        $response = $this->actingAs($agent)->get('/dashboard');

        $response->assertStatus(200);
        
        // Check that only agent products are visible
        $products = $response->viewData('products');
        $this->assertCount(1, $products);
        $this->assertEquals('agent_product', $products->first()->product_type);
    }

    public function test_dealers_see_only_dealer_products()
    {
        // Create products for different roles
        $customerProduct = Product::factory()->create([
            'product_type' => 'customer_product',
            'status' => 'IN STOCK'
        ]);
        $agentProduct = Product::factory()->create([
            'product_type' => 'agent_product',
            'status' => 'IN STOCK'
        ]);
        $dealerProduct = Product::factory()->create([
            'product_type' => 'dealer_product',
            'status' => 'IN STOCK'
        ]);

        // Create dealer user
        $dealer = User::factory()->create(['role' => 'dealer']);

        // Act as dealer and visit dashboard
        $response = $this->actingAs($dealer)->get('/dashboard');

        $response->assertStatus(200);
        
        // Check that only dealer products are visible
        $products = $response->viewData('products');
        $this->assertCount(1, $products);
        $this->assertEquals('dealer_product', $products->first()->product_type);
    }

    public function test_admins_see_all_products()
    {
        // Create products for different roles
        $customerProduct = Product::factory()->create([
            'product_type' => 'customer_product',
            'status' => 'IN STOCK'
        ]);
        $agentProduct = Product::factory()->create([
            'product_type' => 'agent_product',
            'status' => 'IN STOCK'
        ]);
        $dealerProduct = Product::factory()->create([
            'product_type' => 'dealer_product',
            'status' => 'IN STOCK'
        ]);

        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);

        // Act as admin and visit dashboard
        $response = $this->actingAs($admin)->get('/dashboard');

        $response->assertStatus(200);
        
        // Check that all products are visible
        $products = $response->viewData('products');
        $this->assertCount(3, $products);
        
        $productTypes = $products->pluck('product_type')->toArray();
        $this->assertContains('customer_product', $productTypes);
        $this->assertContains('agent_product', $productTypes);
        $this->assertContains('dealer_product', $productTypes);
    }

    public function test_product_scope_methods_work_correctly()
    {
        // Create products for different roles
        Product::factory()->create(['product_type' => 'customer_product']);
        Product::factory()->create(['product_type' => 'agent_product']);
        Product::factory()->create(['product_type' => 'dealer_product']);

        // Test scope methods
        $this->assertCount(1, Product::forCustomers()->get());
        $this->assertCount(1, Product::forAgents()->get());
        $this->assertCount(1, Product::forDealers()->get());
        
        // Test forRole scope
        $this->assertCount(1, Product::forRole('customer')->get());
        $this->assertCount(1, Product::forRole('agent')->get());
        $this->assertCount(1, Product::forRole('dealer')->get());
        $this->assertCount(3, Product::forRole('admin')->get()); // Admin sees all
    }
}