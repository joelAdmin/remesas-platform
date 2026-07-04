<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\ExchangeCorridorRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExchangeCorridorRequest;
use App\Http\Requests\UpdateExchangeCorridorRequest;
use App\Http\Resources\ExchangeCorridorResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeCorridorController extends Controller
{
    public function __construct(
        private readonly ExchangeCorridorRepositoryInterface $exchangeCorridorRepository,
    ) {
        $this->middleware('permission:exchange-corridors.view')->only(['index', 'show']);
        $this->middleware('permission:exchange-corridors.create')->only(['store']);
        $this->middleware('permission:exchange-corridors.edit')->only(['update']);
        $this->middleware('permission:exchange-corridors.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $corridors = $request->has('per_page')
            ? $this->exchangeCorridorRepository->paginate((int) $request->per_page)
            : $this->exchangeCorridorRepository->all();

        return response()->json(['data' => ExchangeCorridorResource::collection($corridors)]);
    }

    public function store(StoreExchangeCorridorRequest $request): JsonResponse
    {
        $corridor = $this->exchangeCorridorRepository->create($request->validated());

        return response()->json([
            'message' => 'Exchange corridor created successfully',
            'data' => new ExchangeCorridorResource($corridor),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $corridor = $this->exchangeCorridorRepository->findById($id);

        if (!$corridor) {
            return response()->json(['error' => 'Exchange corridor not found'], 404);
        }

        return response()->json(['data' => new ExchangeCorridorResource($corridor)]);
    }

    public function update(UpdateExchangeCorridorRequest $request, int $id): JsonResponse
    {
        $corridor = $this->exchangeCorridorRepository->findById($id);

        if (!$corridor) {
            return response()->json(['error' => 'Exchange corridor not found'], 404);
        }

        $updated = $this->exchangeCorridorRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Exchange corridor updated successfully',
            'data' => new ExchangeCorridorResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $corridor = $this->exchangeCorridorRepository->findById($id);

        if (!$corridor) {
            return response()->json(['error' => 'Exchange corridor not found'], 404);
        }

        $this->exchangeCorridorRepository->delete($id);

        return response()->json(['message' => 'Exchange corridor deleted successfully']);
    }
}
