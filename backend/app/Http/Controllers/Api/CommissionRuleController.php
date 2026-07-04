<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CommissionRuleRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommissionRuleRequest;
use App\Http\Requests\UpdateCommissionRuleRequest;
use App\Http\Resources\CommissionRuleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommissionRuleController extends Controller
{
    public function __construct(
        private readonly CommissionRuleRepositoryInterface $commissionRuleRepository,
    ) {
        $this->middleware('permission:commission-rules.view')->only(['index', 'show']);
        $this->middleware('permission:commission-rules.create')->only(['store']);
        $this->middleware('permission:commission-rules.edit')->only(['update']);
        $this->middleware('permission:commission-rules.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $rules = $request->has('per_page')
            ? $this->commissionRuleRepository->paginate((int) $request->per_page)
            : $this->commissionRuleRepository->all();

        return response()->json(['data' => CommissionRuleResource::collection($rules)]);
    }

    public function store(StoreCommissionRuleRequest $request): JsonResponse
    {
        $rule = $this->commissionRuleRepository->create($request->validated());

        return response()->json([
            'message' => 'Commission rule created successfully',
            'data' => new CommissionRuleResource($rule),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $rule = $this->commissionRuleRepository->findById($id);

        if (!$rule) {
            return response()->json(['error' => 'Commission rule not found'], 404);
        }

        return response()->json(['data' => new CommissionRuleResource($rule)]);
    }

    public function update(UpdateCommissionRuleRequest $request, int $id): JsonResponse
    {
        $rule = $this->commissionRuleRepository->findById($id);

        if (!$rule) {
            return response()->json(['error' => 'Commission rule not found'], 404);
        }

        $updated = $this->commissionRuleRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Commission rule updated successfully',
            'data' => new CommissionRuleResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $rule = $this->commissionRuleRepository->findById($id);

        if (!$rule) {
            return response()->json(['error' => 'Commission rule not found'], 404);
        }

        $this->commissionRuleRepository->delete($id);

        return response()->json(['message' => 'Commission rule deleted successfully']);
    }
}
