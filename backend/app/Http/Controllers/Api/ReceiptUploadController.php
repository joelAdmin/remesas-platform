<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ReceiptUploadController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:remittances.edit')->only(['store']);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ])->validate();

        $file = $validated['file'];
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('receipts', $filename, 'public');

        return response()->json([
            'url' => '/storage/' . $path,
        ], 201);
    }
}
