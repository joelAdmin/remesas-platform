<?php

namespace App\Http\Controllers\Api;

use App\Models\SourceAccount;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SourceAccountController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:source-accounts.view')->only(['index']);
        $this->middleware('permission:source-accounts.create')->only(['store']);
        $this->middleware('permission:source-accounts.edit')->only(['update']);
        $this->middleware('permission:source-accounts.delete')->only(['destroy']);
    }

    public function index(Request $request): JsonResponse
    {
        $query = SourceAccount::with('country', 'currency');
        if ($request->has('currency_id')) {
            $query->where('currency_id', $request->currency_id);
        }
        return response()->json(['data' => $query->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'country_id' => 'nullable|exists:countries,id',
            'currency_id' => 'required|exists:currencies,id',
            'account_holder' => 'required|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'required|string|max:100',
            'account_type' => 'nullable|string|max:50',
        ])->validate();

        $account = SourceAccount::create($validated);

        return response()->json([
            'message' => 'Source account created',
            'data' => $account,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $account = SourceAccount::find($id);
        if (!$account) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $validated = Validator::make($request->all(), [
            'country_id' => 'nullable|exists:countries,id',
            'currency_id' => 'required|exists:currencies,id',
            'account_holder' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'account_type' => 'nullable|string|max:50',
        ])->validate();

        $account->update($validated);

        return response()->json([
            'message' => 'Source account updated',
            'data' => $account->fresh(),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $account = SourceAccount::find($id);
        if (!$account) {
            return response()->json(['error' => 'Not found'], 404);
        }
        $account->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
