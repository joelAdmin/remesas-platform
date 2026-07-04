<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\ClientRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(
        private readonly ClientRepositoryInterface $clientRepository,
    ) {
        $this->middleware('permission:clients.view')->only(['index', 'show']);
        $this->middleware('permission:clients.create')->only(['store']);
        $this->middleware('permission:clients.edit')->only(['update']);
        $this->middleware('permission:clients.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $clients = $request->has('per_page')
            ? $this->clientRepository->paginate((int) $request->per_page)
            : $this->clientRepository->all();

        return response()->json(['data' => ClientResource::collection($clients)]);
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $client = $this->clientRepository->create($request->validated());

        return response()->json([
            'message' => 'Client created successfully',
            'data' => new ClientResource($client),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $client = $this->clientRepository->findById($id);

        if (!$client) {
            return response()->json(['error' => 'Client not found'], 404);
        }

        return response()->json(['data' => new ClientResource($client)]);
    }

    public function update(UpdateClientRequest $request, int $id): JsonResponse
    {
        $client = $this->clientRepository->findById($id);

        if (!$client) {
            return response()->json(['error' => 'Client not found'], 404);
        }

        $updated = $this->clientRepository->update($id, $request->validated());

        return response()->json([
            'message' => 'Client updated successfully',
            'data' => new ClientResource($updated),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $client = $this->clientRepository->findById($id);

        if (!$client) {
            return response()->json(['error' => 'Client not found'], 404);
        }

        $this->clientRepository->delete($id);

        return response()->json(['message' => 'Client deleted successfully']);
    }
}
