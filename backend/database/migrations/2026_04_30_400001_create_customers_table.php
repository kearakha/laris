<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('password');
            $table->string('avatar')->nullable();
            $table->unsignedInteger('loyalty_points')->default(0);
            $table->string('loyalty_tier')->default('bronze'); // bronze/silver/gold/platinum
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable(); // male/female/other
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['tenant_id', 'email']);
            $table->unique(['tenant_id', 'phone']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
