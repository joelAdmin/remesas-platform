<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Remittance;
use App\Models\RemittancePromoter;
use App\Models\RemittanceResponsible;
use App\Models\WorkCycle;
use App\Exports\ProfitReportExport;
use App\Exports\PromoterReportExport;
use App\Exports\ResponsibleReportExport;
use App\Exports\RemittanceReportExport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;

class ReportsController extends Controller
{
    private function applyFilters(Request $request, $query)
    {
        if (!$request->filled('status')) {
            $query->whereNotIn('status', ['cancelled']);
        }
        if ($request->filled('work_cycle_id')) {
            $query->where('work_cycle_id', $request->work_cycle_id);
        }
        if ($request->filled('exchange_corridor_id')) {
            $query->where('exchange_corridor_id', $request->exchange_corridor_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        return $query;
    }

    public function summary(Request $request): JsonResponse
    {
        $query = $this->applyFilters($request, Remittance::query());

        $totalRemittances = (clone $query)->count();
        $totalProfitUsdt = (float) (clone $query)->sum('profit_usdt');
        $totalProfitUsd = (float) (clone $query)->sum('total_profit_usd');
        $totalOriginAmount = (float) (clone $query)->sum('origin_amount');

        $byStatus = (clone $query)
            ->selectRaw('status, count(*) as count, sum(profit_usdt) as profit_usdt, sum(total_profit_usd) as profit_usd')
            ->groupBy('status')
            ->get();

        $workCycle = null;
        if ($request->filled('work_cycle_id')) {
            $workCycle = WorkCycle::find($request->work_cycle_id);
        }

        return response()->json(['data' => [
            'total_remittances' => $totalRemittances,
            'total_profit_usdt' => round($totalProfitUsdt, 2),
            'total_profit_usd' => round($totalProfitUsd, 2),
            'total_origin_amount' => round($totalOriginAmount, 2),
            'by_status' => $byStatus,
            'work_cycle' => $workCycle ? ['id' => $workCycle->id, 'name' => $workCycle->name] : null,
        ]]);
    }

    public function profit(Request $request): JsonResponse
    {
        $query = $this->applyFilters($request, Remittance::query());

        $daily = (clone $query)
            ->selectRaw('DATE(created_at) as date, count(*) as count, sum(profit_usdt) as profit_usdt, sum(total_profit_usd) as profit_usd, sum(origin_amount) as origin_amount')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        $total = [
            'total_remittances' => (clone $query)->count(),
            'total_profit_usdt' => round((float) (clone $query)->sum('profit_usdt'), 2),
            'total_profit_usd' => round((float) (clone $query)->sum('total_profit_usd'), 2),
            'total_origin_amount' => round((float) (clone $query)->sum('origin_amount'), 2),
        ];

        return response()->json(['data' => [
            'daily' => $daily,
            'total' => $total,
        ]]);
    }

    public function promoters(Request $request): JsonResponse
    {
        $remittanceIds = $this->applyFilters($request, Remittance::query())->pluck('id');

        $promoters = RemittancePromoter::whereIn('remittance_id', $remittanceIds)
            ->selectRaw('user_id, sum(profit_percent) as total_percent, count(*) as remittance_count')
            ->groupBy('user_id')
            ->with('user:id,name')
            ->get()
            ->map(function ($p) use ($remittanceIds) {
                $totalProfit = RemittancePromoter::where('user_id', $p->user_id)
                    ->whereIn('remittance_id', $remittanceIds)
                    ->join('remittances', 'remittance_promoters.remittance_id', '=', 'remittances.id')
                    ->sum(\DB::raw('remittances.profit_usdt * remittance_promoters.profit_percent / 100'));

                return [
                    'user_id' => $p->user_id,
                    'user_name' => $p->user?->name,
                    'total_percent_sum' => round((float) $p->total_percent, 2),
                    'remittance_count' => (int) $p->remittance_count,
                    'total_earnings_usdt' => round((float) $totalProfit, 2),
                ];
            })
            ->sortByDesc('total_earnings_usdt')
            ->values();

        return response()->json(['data' => $promoters]);
    }

    public function responsibles(Request $request): JsonResponse
    {
        $remittanceIds = $this->applyFilters($request, Remittance::query())->pluck('id');

        $responsibles = RemittanceResponsible::whereIn('remittance_id', $remittanceIds)
            ->selectRaw('user_id, sum(assigned_percent) as total_percent, count(*) as remittance_count')
            ->groupBy('user_id')
            ->with('user:id,name')
            ->get()
            ->map(function ($r) use ($remittanceIds) {
                $totalProfit = RemittanceResponsible::where('user_id', $r->user_id)
                    ->whereIn('remittance_id', $remittanceIds)
                    ->join('remittances', 'remittance_responsibles.remittance_id', '=', 'remittances.id')
                    ->sum(\DB::raw('remittances.total_profit_usd * remittance_responsibles.assigned_percent / 100'));

                return [
                    'user_id' => $r->user_id,
                    'user_name' => $r->user?->name,
                    'total_percent_sum' => round((float) $r->total_percent, 2),
                    'remittance_count' => (int) $r->remittance_count,
                    'total_earnings_usd' => round((float) $totalProfit, 2),
                ];
            })
            ->sortByDesc('total_earnings_usd')
            ->values();

        return response()->json(['data' => $responsibles]);
    }

    public function remittances(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);

        $remittances = $this->applyFilters($request, Remittance::query())
            ->with('client:id,full_name', 'exchangeCorridor:id,name', 'promoters.user:id,name', 'workCycle:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        $remittances->getCollection()->transform(function ($r) {
            return [
                'id' => $r->id,
                'ref_ve' => $r->ref_ve,
                'client_name' => $r->client?->full_name,
                'corridor_name' => $r->exchangeCorridor?->name,
                'origin_amount' => (float) $r->origin_amount,
                'buy_rate' => (float) $r->buy_rate,
                'sell_rate' => (float) $r->sell_rate,
                'profit_usdt' => (float) $r->profit_usdt,
                'total_profit_usd' => (float) $r->total_profit_usd,
                'status' => $r->status,
                'work_cycle_name' => $r->workCycle?->name,
                'promoters' => $r->promoters->map(fn($p) => [
                    'name' => $p->user?->name,
                    'percent' => (float) $p->profit_percent,
                ]),
                'created_at' => $r->created_at,
            ];
        });

        return response()->json(['data' => $remittances]);
    }

    public function exportProfit(Request $request)
    {
        $query = $this->applyFilters($request, Remittance::query());
        $data = (clone $query)
            ->selectRaw('DATE(created_at) as date, count(*) as count, sum(profit_usdt) as profit_usdt, sum(total_profit_usd) as profit_usd, sum(origin_amount) as origin_amount')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        return Excel::download(new ProfitReportExport($data), 'reporte_ganancias.xlsx');
    }

    public function exportPromoters(Request $request)
    {
        $remittanceIds = $this->applyFilters($request, Remittance::query())->pluck('id');

        $promoters = RemittancePromoter::whereIn('remittance_id', $remittanceIds)
            ->selectRaw('user_id, sum(profit_percent) as total_percent, count(*) as remittance_count')
            ->groupBy('user_id')
            ->with('user:id,name')
            ->get()
            ->map(function ($p) use ($remittanceIds) {
                $totalProfit = RemittancePromoter::where('user_id', $p->user_id)
                    ->whereIn('remittance_id', $remittanceIds)
                    ->join('remittances', 'remittance_promoters.remittance_id', '=', 'remittances.id')
                    ->sum(\DB::raw('remittances.profit_usdt * remittance_promoters.profit_percent / 100'));

                return [
                    'user_name' => $p->user?->name,
                    'remittance_count' => (int) $p->remittance_count,
                    'total_percent_sum' => round((float) $p->total_percent, 2),
                    'total_earnings_usdt' => round((float) $totalProfit, 2),
                ];
            })
            ->sortByDesc('total_earnings_usdt')
            ->values();

        return Excel::download(new PromoterReportExport($promoters), 'reporte_promotores.xlsx');
    }

    public function exportResponsibles(Request $request)
    {
        $remittanceIds = $this->applyFilters($request, Remittance::query())->pluck('id');

        $responsibles = RemittanceResponsible::whereIn('remittance_id', $remittanceIds)
            ->selectRaw('user_id, sum(assigned_percent) as total_percent, count(*) as remittance_count')
            ->groupBy('user_id')
            ->with('user:id,name')
            ->get()
            ->map(function ($r) use ($remittanceIds) {
                $totalProfit = RemittanceResponsible::where('user_id', $r->user_id)
                    ->whereIn('remittance_id', $remittanceIds)
                    ->join('remittances', 'remittance_responsibles.remittance_id', '=', 'remittances.id')
                    ->sum(\DB::raw('remittances.total_profit_usd * remittance_responsibles.assigned_percent / 100'));

                return [
                    'user_name' => $r->user?->name,
                    'remittance_count' => (int) $r->remittance_count,
                    'total_percent_sum' => round((float) $r->total_percent, 2),
                    'total_earnings_usd' => round((float) $totalProfit, 2),
                ];
            })
            ->sortByDesc('total_earnings_usd')
            ->values();

        return Excel::download(new ResponsibleReportExport($responsibles), 'reporte_responsables.xlsx');
    }

    public function exportRemittances(Request $request)
    {
        $remittances = $this->applyFilters($request, Remittance::query())
            ->with('client:id,full_name', 'exchangeCorridor:id,name', 'promoters.user:id,name', 'workCycle:id,name')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($r) {
                return [
                    'ref_ve' => $r->ref_ve,
                    'cliente' => $r->client?->full_name,
                    'corredor' => $r->exchangeCorridor?->name,
                    'monto_origen' => (float) $r->origin_amount,
                    'tasa_compra' => (float) $r->buy_rate,
                    'tasa_venta' => (float) $r->sell_rate,
                    'ganancia_usdt' => (float) $r->profit_usdt,
                    'ganancia_usd' => (float) $r->total_profit_usd,
                    'estado' => $r->status,
                    'ciclo' => $r->workCycle?->name,
                    'fecha' => $r->created_at,
                ];
            });

        return Excel::download(new RemittanceReportExport($remittances), 'reporte_remesas.xlsx');
    }
}
