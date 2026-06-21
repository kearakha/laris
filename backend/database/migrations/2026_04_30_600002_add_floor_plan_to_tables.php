<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->string('floor')->default('1')->after('status'); // lantai/area: "1", "2", "outdoor"
            $table->unsignedSmallInteger('pos_x')->default(0)->after('floor'); // grid position X
            $table->unsignedSmallInteger('pos_y')->default(0)->after('pos_x'); // grid position Y
            $table->string('shape')->default('square')->after('pos_y'); // square/round
        });
    }

    public function down(): void
    {
        Schema::table('tables', function (Blueprint $table) {
            $table->dropColumn(['floor', 'pos_x', 'pos_y', 'shape']);
        });
    }
};
