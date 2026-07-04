<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CurrencyRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCurrencyRequest;
use App\Http\Requests\UpdateCurrencyRequest;
use App\Http\Resources\CurrencyResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    public function __construct(
        private readonly CurrencyRepositoryInterface $currencyRepository,
    ) {
        $this->middleware('permission:currencies.view')->only(['index', 'show']);
        $this->middleware('permission:currencies.create')->only(['store']);
        $this->middleware('permission:currencies.edit')->only(['update']);
        $this->middleware('permission:currencies.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $currencies = $request->has('per_page')
            ? $this->currencyRepository->paginate((int) $request->per_page)
            : $this->currencyRepository->all();

        return response()->json(['data' => CurrencyResource::collection($currencies)]);
    }

    public function store(StoreCurrencyRequest $request): JsonResponse
    {
        $currency = $this->currencyRepository->create($request->validated());

        return response()->json([
            'message' => 'Currency created successfully',
            'data' => new CurrencyResource($currency),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $currency = $this->currencyRepository->findById($id);

        if (!$currency) {
            return response()->json(['error' => 'Currency not found'], 404);
        }

        return response()->json(['data' => new CurrencyResource($currency)]);
    }

    public function update(UpdateCurrencyRequest $request, int $id): JsonResponse
    {
        $currency = $this->currencyRepository->findById($id);

        if (!$currency) {
            return response()->json(['error' => 'Currency not found'], 404);
        }

        $updated = $this->currencyRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Currency updated successfully',
            'data' => new CurrencyResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $currency = $this->currencyRepository->findById($id);

        if (!$currency) {
            return response()->json(['error' => 'Currency not found'], 404);
        }

        $this->currencyRepository->delete($id);

        return response()->json(['message' => 'Currency deleted successfully']);
    }
}
