<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->decimal('usdt_to_sell', 12, 2)->default(0)->after('destination_net_amount');
            $table->decimal('profit_usdt', 12, 2)->default(0)->after('usdt_to_sell');
        });
    }

    public function down(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->dropColumn(['usdt_to_sell', 'profit_usdt']);
        });
    }
};
