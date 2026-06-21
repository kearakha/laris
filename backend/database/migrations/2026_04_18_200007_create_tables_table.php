<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained('outlets')->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->string('name');
            $table->integer('capacity')->default(4);
            $table->string('qr_code')->unique();
            $table->string('status')->default('available');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['outlet_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tables');
    }
};
