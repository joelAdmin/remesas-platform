<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CountryRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCountryRequest;
use App\Http\Requests\UpdateCountryRequest;
use App\Http\Resources\CountryResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CountryController extends Controller
{
    public function __construct(
        private readonly CountryRepositoryInterface $countryRepository,
    ) {
        $this->middleware('permission:countries.view')->only(['index', 'show']);
        $this->middleware('permission:countries.create')->only(['store']);
        $this->middleware('permission:countries.edit')->only(['update']);
        $this->middleware('permission:countries.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $countries = $request->has('per_page')
            ? $this->countryRepository->paginate((int) $request->per_page)
            : $this->countryRepository->all();

        return response()->json(['data' => CountryResource::collection($countries)]);
    }

    public function store(StoreCountryRequest $request): JsonResponse
    {
        $country = $this->countryRepository->create($request->validated());

        return response()->json([
            'message' => 'Country created successfully',
            'data' => new CountryResource($country),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $country = $this->countryRepository->findById($id);

        if (!$country) {
            return response()->json(['error' => 'Country not found'], 404);
        }

        return response()->json(['data' => new CountryResource($country)]);
    }

    public function update(UpdateCountryRequest $request, int $id): JsonResponse
    {
        $country = $this->countryRepository->findById($id);

        if (!$country) {
            return response()->json(['error' => 'Country not found'], 404);
        }

        $updated = $this->countryRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Country updated successfully',
            'data' => new CountryResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $country = $this->countryRepository->findById($id);

        if (!$country) {
            return response()->json(['error' => 'Country not found'], 404);
        }

        $this->countryRepository->delete($id);

        return response()->json(['message' => 'Country deleted successfully']);
    }
}
