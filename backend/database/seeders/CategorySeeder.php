<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = Http::retry(3, 500)
            ->timeout(15)
            ->get('https://dummyjson.com/products/category-list')
            ->throw()
            ->json();

        foreach ($categories as $category) {
            Category::updateOrCreate(
                ['slug' => $category],
                [
                    'name' => Str::headline($category),
                    'slug' => $category,
                ]
            );
        }

        $this->command->info('Seeded ' . count($categories) . ' categories.');
    }
}
