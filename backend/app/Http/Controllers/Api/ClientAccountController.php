<?php

namespace App\Http\Controllers\Api;

use App\Models\ClientAccount;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ClientAccountController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:client-accounts.view')->only(['index']);
        $this->middleware('permission:client-accounts.create')->only(['store']);
        $this->middleware('permission:client-accounts.edit')->only(['update']);
        $this->middleware('permission:client-accounts.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = ClientAccount::with('client', 'country', 'currency');
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->has('currency_id')) {
            $query->where('currency_id', $request->currency_id);
        }
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'client_id' => 'required|exists:clients,id',
            'country_id' => 'nullable|exists:countries,id',
            'currency_id' => 'nullable|exists:currencies,id',
            'account_holder' => 'required|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'required|string|max:100',
            'account_type' => 'nullable|string|max:50',
            'is_default' => 'nullable|boolean',
        ])->validate();

        $isDefault = $validated['is_default'] ?? false;
        if ($isDefault) {
            ClientAccount::where('client_id', $validated['client_id'])->update(['is_default' => false]);
        }

        $account = ClientAccount::create($validated);

        return response()->json([
            'message' => 'Client account created',
            'data' => $account->load('client'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $account = ClientAccount::find($id);
        if (!$account) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $validated = Validator::make($request->all(), [
            'country_id' => 'nullable|exists:countries,id',
            'currency_id' => 'nullable|exists:currencies,id',
            'account_holder' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'account_type' => 'nullable|string|max:50',
            'is_default' => 'nullable|boolean',
        ])->validate();

        if (!empty($validated['is_default'])) {
            ClientAccount::where('client_id', $account->client_id)
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $account->update($validated);

        return response()->json([
            'message' => 'Client account updated',
            'data' => $account->fresh()->load('client'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $account = ClientAccount::find($id);
        if (!$account) {
            return response()->json(['error' => 'Not found'], 404);
        }
        $account->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
