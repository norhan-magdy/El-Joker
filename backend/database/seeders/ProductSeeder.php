<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Inventory;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    private const API_URL = 'https://dummyjson.com/products';

    public function run(): void
    {
        $response = Http::retry(3, 500)
            ->timeout(30)
            ->get(self::API_URL, [
                'limit' => 0,
                'select' => 'title,description,price,category,thumbnail',
            ])
            ->throw()
            ->json();

        $categoryIds = [];

        foreach ($response['products'] as $item) {
            $categoryIds[$item['category']] ??= Category::updateOrCreate(
                ['slug' => $item['category']],
                ['name' => Str::headline($item['category'])]
            )->id;

            $product = Product::updateOrCreate(
                ['slug' => Str::slug($item['title'])],
                [
                    'category_id' => $categoryIds[$item['category']],
                    'title' => $item['title'],
                    'slug' => Str::slug($item['title']),
                    'description' => $item['description'],
                    'price' => $item['price'],
                    'image_url' => $item['thumbnail'],
                    'is_active' => true,
                ]
            );

            Inventory::updateOrCreate(
                ['product_id' => $product->id],
                ['quantity' => random_int(10, 120)]
            );
        }

        $this->command->info('Seeded ' . count($response['products']) . ' products with online images.');
    }
}
