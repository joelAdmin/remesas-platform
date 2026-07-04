<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\RemittancePromoterRepositoryInterface;
use App\Contracts\Repositories\RemittanceRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\CalculateRemittanceRequest;
use App\Http\Requests\StoreRemittanceRequest;
use App\Http\Requests\UpdateRemittanceRequest;
use App\Http\Resources\RemittanceResource;
use App\Models\Remittance;
use App\Services\RefGeneratorService;
use App\Services\RemittanceCalculationService;
use App\Services\WorkCycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RemittanceController extends Controller
{
    public function __construct(
        private readonly RemittanceRepositoryInterface $remittanceRepository,
        private readonly RemittanceCalculationService $calculationService,
        private readonly RefGeneratorService $refGenerator,
        private readonly RemittancePromoterRepositoryInterface $promoterRepository,
        private readonly WorkCycleService $workCycleService,
    ) {
        $this->middleware('permission:remittances.view')->only(['index', 'show', 'promoterEarnings']);
        $this->middleware('permission:remittances.create')->only(['store', 'calculate']);
        $this->middleware('permission:remittances.edit')->only(['update']);
        $this->middleware('permission:remittances.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        if ($request->hasAny(['status', 'client_id', 'corridor_id', 'date_from', 'date_to'])) {
            $remittances = $this->remittanceRepository->paginateWithFilters(
                $request->only(['status', 'client_id', 'corridor_id', 'date_from', 'date_to']),
                (int) ($request->per_page ?? 15),
            );
        } elseif ($request->has('per_page')) {
            $remittances = $this->remittanceRepository->paginate((int) $request->per_page);
        } else {
            $remittances = $this->remittanceRepository->all();
        }

        return response()->json(['data' => RemittanceResource::collection($remittances)]);
    }

    public function store(StoreRemittanceRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['ref_ve'] = $this->refGenerator->generate();

        if ($this->workCycleService->isEnabled()) {
            $activeCycle = $this->workCycleService->getActiveCycle();
            if (!$activeCycle) {
                return response()->json(['error' => 'No hay un ciclo activo. Debe abrir un ciclo de trabajo antes de crear remesas.'], 422);
            }
            $data['work_cycle_id'] = $activeCycle->id;
        }

        $calculated = $this->calculationService->calculateForCorridor(
            originAmount: (float) ($data['origin_amount'] ?? 0),
            buyRate: (float) ($data['buy_rate'] ?? 0),
            sellRate: (float) ($data['sell_rate'] ?? 0),
            exchangeCorridorId: (int) $data['exchange_corridor_id'],
            tasaPublico: (float) ($data['tasa_publico'] ?? 0),
        );

        $data = array_merge($data, $calculated);
        $data['status'] ??= 'pending';
        $data['registered_at'] ??= now()->toDateString();

        $remittance = $this->remittanceRepository->create(
            collect($data)->except(['tasa_publico', 'promoters'])->toArray()
        );

        if (!empty($data['promoters'])) {
            $this->promoterRepository->syncForRemittance($remittance->id, $data['promoters']);
        }

        $remittance->load('promoters.user');

        return response()->json([
            'message' => 'Remittance created successfully',
            'data' => new RemittanceResource($remittance),
        ], 201);
    }

    public function calculate(CalculateRemittanceRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = $this->calculationService->calculateForCorridor(
            originAmount: (float) $data['origin_amount'],
            buyRate: (float) $data['buy_rate'],
            sellRate: (float) $data['sell_rate'],
            exchangeCorridorId: (int) $data['exchange_corridor_id'],
            tasaPublico: (float) ($data['tasa_publico'] ?? 0),
        );

        return response()->json(['data' => $result]);
    }

    public function show(int $id): JsonResponse
    {
        $remittance = $this->remittanceRepository->findById($id);

        if (!$remittance) {
            return response()->json(['error' => 'Remittance not found'], 404);
        }

        $remittance->load('promoters.user', 'exchangeCorridor');

        return response()->json(['data' => new RemittanceResource($remittance)]);
    }

    public function update(UpdateRemittanceRequest $request, int $id): JsonResponse
    {
        $remittance = $this->remittanceRepository->findById($id);

        if (!$remittance) {
            return response()->json(['error' => 'Remittance not found'], 404);
        }

        $data = $request->validated();

        $recalculate = isset($data['origin_amount']) || isset($data['buy_rate']) || isset($data['sell_rate']) || isset($data['tasa_publico']);
        if ($recalculate) {
            $calculated = $this->calculationService->calculateForCorridor(
                originAmount: (float) ($data['origin_amount'] ?? $remittance->origin_amount),
                buyRate: (float) ($data['buy_rate'] ?? $remittance->buy_rate),
                sellRate: (float) ($data['sell_rate'] ?? $remittance->sell_rate),
                exchangeCorridorId: (int) ($data['exchange_corridor_id'] ?? $remittance->exchange_corridor_id),
                tasaPublico: (float) ($data['tasa_publico'] ?? 0),
            );
            $data = array_merge($data, $calculated);
        }

        $updated = $this->remittanceRepository->update($id,
            collect($data)->except(['tasa_publico', 'promoters'])->toArray()
        );

        if (array_key_exists('promoters', $data)) {
            if (!empty($data['promoters'])) {
                $this->promoterRepository->syncForRemittance($id, $data['promoters']);
            } else {
                $this->promoterRepository->syncForRemittance($id, []);
            }
        }

        $updated->load('promoters.user');

        return response()->json([
            'message' => 'Remittance updated successfully',
            'data' => new RemittanceResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $remittance = $this->remittanceRepository->findById($id);

        if (!$remittance) {
            return response()->json(['error' => 'Remittance not found'], 404);
        }

        $this->remittanceRepository->delete($id);

        return response()->json(['message' => 'Remittance deleted successfully']);
    }

    public function promoterEarnings(Request $request): JsonResponse
    {
        $request->validate([
            'year' => 'required|integer|min:2000|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $query = \App\Models\RemittancePromoter::query()
            ->selectRaw('user_id, SUM(profit_percent) as total_percent, COUNT(*) as remittance_count')
            ->whereHas('remittance', function ($q) use ($request) {
                $q->whereYear('registered_at', $request->year)
                  ->whereMonth('registered_at', $request->month);
            });

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $promoters = $query->groupBy('user_id')->with('user')->get();

        $remittances = \App\Models\Remittance::whereYear('registered_at', $request->year)
            ->whereMonth('registered_at', $request->month)
            ->get();

        $earnings = $promoters->map(function ($p) use ($remittances) {
            $promoterRemittances = \App\Models\RemittancePromoter::where('user_id', $p->user_id)
                ->whereIn('remittance_id', $remittances->pluck('id'))
                ->with('remittance')
                ->get();

            $totalProfit = 0;
            foreach ($promoterRemittances as $pr) {
                $totalProfit += (float) $pr->remittance->profit_usdt * ($pr->profit_percent / 100);
            }

            return [
                'user_id' => $p->user_id,
                'user_name' => $p->user?->name,
                'total_percent_sum' => round((float) $p->total_percent, 2),
                'remittance_count' => (int) $p->remittance_count,
                'total_earnings_usdt' => round($totalProfit, 2),
            ];
        });

        return response()->json(['data' => $earnings]);
    }
}
