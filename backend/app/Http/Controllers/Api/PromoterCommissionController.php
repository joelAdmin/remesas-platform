<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\PromoterCommissionRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePromoterCommissionRequest;
use App\Http\Requests\UpdatePromoterCommissionRequest;
use App\Http\Resources\PromoterCommissionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromoterCommissionController extends Controller
{
    public function __construct(
        private readonly PromoterCommissionRepositoryInterface $promoterCommissionRepository,
    ) {
        $this->middleware('permission:promoter-commissions.view')->only(['index', 'show']);
        $this->middleware('permission:promoter-commissions.create')->only(['store']);
        $this->middleware('permission:promoter-commissions.edit')->only(['update']);
        $this->middleware('permission:promoter-commissions.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $commissions = $request->has('per_page')
            ? $this->promoterCommissionRepository->paginate((int) $request->per_page)
            : $this->promoterCommissionRepository->all();

        return response()->json(['data' => PromoterCommissionResource::collection($commissions)]);
    }

    public function store(StorePromoterCommissionRequest $request): JsonResponse
    {
        $commission = $this->promoterCommissionRepository->create($request->validated());

        return response()->json([
            'message' => 'Promoter commission created successfully',
            'data' => new PromoterCommissionResource($commission),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $commission = $this->promoterCommissionRepository->findById($id);

        if (!$commission) {
            return response()->json(['error' => 'Promoter commission not found'], 404);
        }

        return response()->json(['data' => new PromoterCommissionResource($commission)]);
    }

    public function update(UpdatePromoterCommissionRequest $request, int $id): JsonResponse
    {
        $commission = $this->promoterCommissionRepository->findById($id);

        if (!$commission) {
            return response()->json(['error' => 'Promoter commission not found'], 404);
        }

        $updated = $this->promoterCommissionRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Promoter commission updated successfully',
            'data' => new PromoterCommissionResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $commission = $this->promoterCommissionRepository->findById($id);

        if (!$commission) {
            return response()->json(['error' => 'Promoter commission not found'], 404);
        }

        $this->promoterCommissionRepository->delete($id);

        return response()->json(['message' => 'Promoter commission deleted successfully']);
    }
}
