<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->string('employee_code')->unique();
            $table->string('position');
            $table->string('salary_type')->default('monthly'); // monthly/daily/hourly
            $table->decimal('salary_amount', 12, 2)->default(0);
            $table->date('hired_at');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // Pagi/Siang/Malam
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });

        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->string('status')->default('scheduled'); // scheduled/completed/absent
            $table->timestamps();

            $table->unique(['employee_id', 'date']);
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->timestamp('clock_in')->nullable();
            $table->timestamp('clock_out')->nullable();
            $table->string('clock_in_photo')->nullable();
            $table->string('status')->default('present'); // present/late/absent/leave
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('shift_assignments');
        Schema::dropIfExists('shifts');
        Schema::dropIfExists('employees');
    }
};
