<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_ingredients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('ingredient_id')->constrained()->cascadeOnDelete();
            $table->decimal('quantity_used', 12, 3);
            $table->timestamps();

            $table->unique(['menu_item_id', 'ingredient_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_ingredients');
    }
};
