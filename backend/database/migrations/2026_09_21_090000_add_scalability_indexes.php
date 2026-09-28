<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->index('issued_at');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index(['user_id', 'created_at']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index(['is_active', 'category_id'], 'products_active_category_idx');
            $table->index(['is_active', 'price'], 'products_active_price_idx');
            $table->index(['category_id', 'price'], 'products_category_price_idx');
            $table->index(['is_active', 'created_at'], 'products_active_created_idx');
        });

        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('CREATE INDEX IF NOT EXISTS invoices_invoice_number_trgm_idx ON invoices USING gin (invoice_number gin_trgm_ops)');
            DB::statement('CREATE INDEX IF NOT EXISTS users_name_trgm_idx ON users USING gin (name gin_trgm_ops)');
            DB::statement('CREATE INDEX IF NOT EXISTS users_email_trgm_idx ON users USING gin (email gin_trgm_ops)');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS users_email_trgm_idx');
            DB::statement('DROP INDEX IF EXISTS users_name_trgm_idx');
            DB::statement('DROP INDEX IF EXISTS invoices_invoice_number_trgm_idx');
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_active_created_idx');
            $table->dropIndex('products_category_price_idx');
            $table->dropIndex('products_active_price_idx');
            $table->dropIndex('products_active_category_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'created_at']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropIndex('issued_at');
        });
    }
};
