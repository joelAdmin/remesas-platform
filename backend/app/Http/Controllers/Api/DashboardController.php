<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\Remittance;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:dashboard.view')->only(['index']);
    }

    public function index(): JsonResponse
    {
        $today = Carbon::today();

        $remittancesToday = Remittance::whereDate('created_at', $today)->whereNotIn('status', ['cancelled'])->count();

        $totalClients = Client::count();

        $totalRemittances = Remittance::whereNotIn('status', ['cancelled'])->count();

        $totalProfit = (float) Remittance::whereNotIn('status', ['cancelled'])->sum('total_profit_usd');

        $remittancesByStatus = Remittance::selectRaw("status, count(*) as count")
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $profitLast7Days = collect();
        $remittancesLast7Days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i);
            $dayProfit = (float) Remittance::whereDate('created_at', $date)->whereNotIn('status', ['cancelled'])->sum('total_profit_usd');
            $dayCount = Remittance::whereDate('created_at', $date)->whereNotIn('status', ['cancelled'])->count();
            $profitLast7Days->push(['date' => $date->format('Y-m-d'), 'profit' => $dayProfit]);
            $remittancesLast7Days->push(['date' => $date->format('Y-m-d'), 'count' => $dayCount]);
        }

        $recent = Remittance::with('client:id,full_name')
            ->whereNotIn('status', ['cancelled'])
            ->latest()
            ->take(5)
            ->get(['id', 'ref_ve', 'client_id', 'origin_amount', 'status', 'created_at']);

        return response()->json(['data' => [
            'remittances_today' => $remittancesToday,
            'total_clients' => $totalClients,
            'total_remittances' => $totalRemittances,
            'total_profit_usd' => round($totalProfit, 2),
            'remittances_by_status' => $remittancesByStatus,
            'profit_last_7_days' => $profitLast7Days,
            'remittances_last_7_days' => $remittancesLast7Days,
            'recent_remittances' => $recent->map(fn($r) => [
                'id' => $r->id,
                'ref_ve' => $r->ref_ve,
                'client_name' => $r->client?->full_name ?? "Cliente #{$r->client_id}",
                'origin_amount' => (float) $r->origin_amount,
                'status' => $r->status,
                'created_at' => $r->created_at,
            ]),
        ]]);
    }
}
