<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\ProfitSharingRuleRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProfitSharingRuleRequest;
use App\Http\Requests\UpdateProfitSharingRuleRequest;
use App\Http\Resources\ProfitSharingRuleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfitSharingRuleController extends Controller
{
    public function __construct(
        private readonly ProfitSharingRuleRepositoryInterface $profitSharingRuleRepository,
    ) {
        $this->middleware('permission:profit-sharing-rules.view')->only(['index', 'show']);
        $this->middleware('permission:profit-sharing-rules.create')->only(['store']);
        $this->middleware('permission:profit-sharing-rules.edit')->only(['update']);
        $this->middleware('permission:profit-sharing-rules.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $rules = $request->has('per_page')
            ? $this->profitSharingRuleRepository->paginate((int) $request->per_page)
            : $this->profitSharingRuleRepository->all();

        return response()->json(['data' => ProfitSharingRuleResource::collection($rules)]);
    }

    public function store(StoreProfitSharingRuleRequest $request): JsonResponse
    {
        $rule = $this->profitSharingRuleRepository->create($request->validated());

        return response()->json([
            'message' => 'Profit sharing rule created successfully',
            'data' => new ProfitSharingRuleResource($rule),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $rule = $this->profitSharingRuleRepository->findById($id);

        if (!$rule) {
            return response()->json(['error' => 'Profit sharing rule not found'], 404);
        }

        return response()->json(['data' => new ProfitSharingRuleResource($rule)]);
    }

    public function update(UpdateProfitSharingRuleRequest $request, int $id): JsonResponse
    {
        $rule = $this->profitSharingRuleRepository->findById($id);

        if (!$rule) {
            return response()->json(['error' => 'Profit sharing rule not found'], 404);
        }

        $updated = $this->profitSharingRuleRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Profit sharing rule updated successfully',
            'data' => new ProfitSharingRuleResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $rule = $this->profitSharingRuleRepository->findById($id);

        if (!$rule) {
            return response()->json(['error' => 'Profit sharing rule not found'], 404);
        }

        $this->profitSharingRuleRepository->delete($id);

        return response()->json(['message' => 'Profit sharing rule deleted successfully']);
    }
}
