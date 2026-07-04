<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->foreignId('work_cycle_id')->nullable()->after('total_assigned_percent')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('remittances', function (Blueprint $table) {
            $table->dropForeign(['work_cycle_id']);
            $table->dropColumn('work_cycle_id');
        });
    }
};
