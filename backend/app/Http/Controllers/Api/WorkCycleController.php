<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\WorkCycleRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWorkCycleRequest;
use App\Http\Requests\UpdateWorkCycleRequest;
use App\Http\Resources\WorkCycleResource;
use App\Services\WorkCycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WorkCycleController extends Controller
{
    public function __construct(
        private readonly WorkCycleRepositoryInterface $workCycleRepository,
        private readonly WorkCycleService $workCycleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $cycles = $request->has('per_page')
            ? $this->workCycleRepository->paginate((int) $request->per_page)
            : $this->workCycleRepository->all()->loadCount('remittances');

        return response()->json(['data' => WorkCycleResource::collection($cycles)]);
    }

    public function store(StoreWorkCycleRequest $request): JsonResponse
    {
        if ($this->workCycleRepository->hasOpen()) {
            return response()->json(['error' => 'Ya existe un ciclo abierto. Ciérrelo antes de crear uno nuevo.'], 422);
        }

        $data = $request->validated();
        $data['created_by'] = auth()->id();

        $cycle = $this->workCycleRepository->create($data);

        return response()->json([
            'message' => 'Ciclo creado exitosamente',
            'data' => new WorkCycleResource($cycle),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $cycle = $this->workCycleRepository->findById($id);

        if (!$cycle) {
            return response()->json(['error' => 'Ciclo no encontrado'], 404);
        }

        $cycle->loadCount('remittances');

        $report = null;
        if ($cycle->status === 'closed') {
            $report = $this->buildReport($cycle);
        }

        return response()->json([
            'data' => new WorkCycleResource($cycle),
            'report' => $report,
        ]);
    }

    public function update(UpdateWorkCycleRequest $request, int $id): JsonResponse
    {
        $cycle = $this->workCycleRepository->findById($id);

        if (!$cycle) {
            return response()->json(['error' => 'Ciclo no encontrado'], 404);
        }

        if ($cycle->status !== 'open') {
            return response()->json(['error' => 'No se puede editar un ciclo cerrado'], 422);
        }

        $updated = $this->workCycleRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Ciclo actualizado exitosamente',
            'data' => new WorkCycleResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $cycle = $this->workCycleRepository->findById($id);

        if (!$cycle) {
            return response()->json(['error' => 'Ciclo no encontrado'], 404);
        }

        if ($cycle->status !== 'open') {
            return response()->json(['error' => 'No se puede eliminar un ciclo cerrado'], 422);
        }

        $this->workCycleRepository->delete($id);

        return response()->json(['message' => 'Ciclo eliminado exitosamente']);
    }

    public function close(int $id): JsonResponse
    {
        $cycle = $this->workCycleRepository->findById($id);

        if (!$cycle) {
            return response()->json(['error' => 'Ciclo no encontrado'], 404);
        }

        if ($cycle->status !== 'open') {
            return response()->json(['error' => 'El ciclo ya está cerrado'], 422);
        }

        $remittances = $cycle->remittances;

        $totalRemittances = $remittances->count();
        $totalProfitUsdt = $remittances->sum('profit_usdt');
        $totalProfitUsd = $remittances->sum('total_profit_usd');

        $updated = $this->workCycleRepository->update($id, [
            'status' => 'closed',
            'end_date' => now()->format('Y-m-d'),
            'closed_by' => auth()->id(),
            'closed_at' => now(),
            'total_remittances' => $totalRemittances,
            'total_profit_usdt' => $totalProfitUsdt,
            'total_profit_usd' => $totalProfitUsd,
        ]);

        $report = $this->buildReport($updated);

        return response()->json([
            'message' => 'Ciclo cerrado exitosamente',
            'data' => new WorkCycleResource($updated),
            'report' => $report,
        ]);
    }

    public function reopen(int $id): JsonResponse
    {
        $cycle = $this->workCycleRepository->findById($id);

        if (!$cycle) {
            return response()->json(['error' => 'Ciclo no encontrado'], 404);
        }

        if ($cycle->status !== 'closed') {
            return response()->json(['error' => 'Solo se puede reabrir un ciclo cerrado'], 422);
        }

        $updated = $this->workCycleRepository->update($id, [
            'status' => 'open',
            'end_date' => null,
            'closed_by' => null,
            'closed_at' => null,
            'total_remittances' => 0,
            'total_profit_usdt' => 0,
            'total_profit_usd' => 0,
        ]);

        return response()->json([
            'message' => 'Ciclo reabierto exitosamente',
            'data' => new WorkCycleResource($updated),
        ]);
    }

    public function toggleSettings(Request $request): JsonResponse
    {
        $request->validate(['enabled' => 'required|boolean']);

        DB::table('settings')->updateOrInsert(
            ['key' => 'work_cycles_enabled'],
            ['value' => $request->enabled ? '1' : '0', 'updated_at' => now()],
        );

        return response()->json([
            'message' => $request->enabled ? 'Trabajo por periodos activado' : 'Trabajo por periodos desactivado',
        ]);
    }

    public function status(): JsonResponse
    {
        $enabled = $this->workCycleService->isEnabled();
        $activeCycle = $this->workCycleRepository->findOpen();

        return response()->json([
            'enabled' => $enabled,
            'active_cycle' => $activeCycle ? new WorkCycleResource($activeCycle) : null,
        ]);
    }

    public function report(int $id): JsonResponse
    {
        $cycle = $this->workCycleRepository->findById($id);

        if (!$cycle) {
            return response()->json(['error' => 'Ciclo no encontrado'], 404);
        }

        $report = $this->buildReport($cycle);

        return response()->json(['data' => $report]);
    }

    private function buildReport($cycle): array
    {
        $remittances = $cycle->remittances()->with('promoters.user', 'responsibles')->get();

        $responsibleSummary = [];
        $promoterSummary = [];

        foreach ($remittances as $rem) {
            foreach ($rem->responsibles ?? [] as $resp) {
                $userId = $resp->user_id;
                $profitUsd = (float) $rem->total_profit_usd * ((float) $resp->assigned_percent / 100);
                if (!isset($responsibleSummary[$userId])) {
                    $responsibleSummary[$userId] = ['user_id' => $userId, 'total_profit_usd' => 0, 'remittance_count' => 0];
                }
                $responsibleSummary[$userId]['total_profit_usd'] += $profitUsd;
                $responsibleSummary[$userId]['remittance_count']++;
            }

            foreach ($rem->promoters ?? [] as $prom) {
                $userId = $prom->user_id;
                $profitUsdt = (float) $rem->profit_usdt * ((float) $prom->profit_percent / 100);
                if (!isset($promoterSummary[$userId])) {
                    $promoterSummary[$userId] = ['user_id' => $userId, 'user_name' => $prom->user?->name, 'total_profit_usdt' => 0, 'remittance_count' => 0];
                }
                $promoterSummary[$userId]['total_profit_usdt'] += $profitUsdt;
                $promoterSummary[$userId]['remittance_count']++;
            }
        }

        return [
            'total_remittances' => $remittances->count(),
            'total_profit_usdt' => round($remittances->sum('profit_usdt'), 2),
            'total_profit_usd' => round($remittances->sum('total_profit_usd'), 2),
            'responsible_summary' => array_values($responsibleSummary),
            'promoter_summary' => array_values($promoterSummary),
        ];
    }
}
