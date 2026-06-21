<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedTinyInteger('overall_rating'); // 1-5
            $table->unsignedTinyInteger('food_rating')->nullable();
            $table->unsignedTinyInteger('service_rating')->nullable();
            $table->unsignedTinyInteger('ambiance_rating')->nullable();
            $table->string('reviewer_name')->nullable(); // for non-auth reviews
            $table->text('comment')->nullable();
            $table->boolean('is_published')->default(true);
            $table->text('reply')->nullable();
            $table->timestamp('replied_at')->nullable();
            $table->timestamps();
        });

        Schema::create('menu_item_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('review_id')->constrained()->cascadeOnDelete();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_reviews');
        Schema::dropIfExists('reviews');
    }
};
