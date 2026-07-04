<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\PromoterGoalRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StorePromoterGoalRequest;
use App\Http\Requests\UpdatePromoterGoalRequest;
use App\Http\Resources\PromoterGoalResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromoterGoalController extends Controller
{
    public function __construct(
        private readonly PromoterGoalRepositoryInterface $promoterGoalRepository,
    ) {
        $this->middleware('permission:promoter-goals.view')->only(['index', 'show']);
        $this->middleware('permission:promoter-goals.create')->only(['store']);
        $this->middleware('permission:promoter-goals.edit')->only(['update']);
        $this->middleware('permission:promoter-goals.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $goals = $request->has('per_page')
            ? $this->promoterGoalRepository->paginate((int) $request->per_page)
            : $this->promoterGoalRepository->all();

        return response()->json(['data' => PromoterGoalResource::collection($goals)]);
    }

    public function store(StorePromoterGoalRequest $request): JsonResponse
    {
        $goal = $this->promoterGoalRepository->create($request->validated());

        return response()->json([
            'message' => 'Promoter goal created successfully',
            'data' => new PromoterGoalResource($goal),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $goal = $this->promoterGoalRepository->findById($id);

        if (!$goal) {
            return response()->json(['error' => 'Promoter goal not found'], 404);
        }

        return response()->json(['data' => new PromoterGoalResource($goal)]);
    }

    public function update(UpdatePromoterGoalRequest $request, int $id): JsonResponse
    {
        $goal = $this->promoterGoalRepository->findById($id);

        if (!$goal) {
            return response()->json(['error' => 'Promoter goal not found'], 404);
        }

        $updated = $this->promoterGoalRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Promoter goal updated successfully',
            'data' => new PromoterGoalResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $goal = $this->promoterGoalRepository->findById($id);

        if (!$goal) {
            return response()->json(['error' => 'Promoter goal not found'], 404);
        }

        $this->promoterGoalRepository->delete($id);

        return response()->json(['message' => 'Promoter goal deleted successfully']);
    }
}
