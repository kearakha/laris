<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketplace_integrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->string('platform'); // gofood, grabfood, shopeefood
            $table->string('api_key')->nullable();
            $table->string('webhook_secret')->nullable();
            $table->string('outlet_token')->unique(); // used in webhook URL
            $table->boolean('is_active')->default(false);
            $table->json('config')->nullable(); // platform-specific config
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->unique(['outlet_id', 'platform']);
        });

        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('outlet_id')->constrained()->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('name');
            $table->string('segment'); // churned/birthday/big_spender/new/all
            $table->string('channel')->default('whatsapp'); // whatsapp/email
            $table->text('message');
            $table->string('status')->default('draft'); // draft/sending/sent/failed
            $table->unsignedInteger('target_count')->default(0);
            $table->unsignedInteger('sent_count')->default(0);
            $table->unsignedInteger('failed_count')->default(0);
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('campaign_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('channel')->default('whatsapp');
            $table->string('recipient'); // phone or email
            $table->string('status')->default('pending'); // pending/sent/failed
            $table->string('error')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('campaign_logs');
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('marketplace_integrations');
    }
};
