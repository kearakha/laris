<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_variant_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('variant_id')->constrained('menu_item_variants')->cascadeOnDelete();
            $table->string('label');
            $table->decimal('price_modifier', 12, 2)->default(0);
            $table->boolean('is_default')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_variant_options');
    }
};
