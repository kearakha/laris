<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_item_tags', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_item_id')->constrained('menu_items')->cascadeOnDelete();
            $table->string('tag');
            $table->timestamps();

            $table->unique(['menu_item_id', 'tag']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_item_tags');
    }
};
