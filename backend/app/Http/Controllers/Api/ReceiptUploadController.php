<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CloudinaryStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReceiptUploadController extends Controller
{
    public function __construct(
        protected CloudinaryStorageService $uploadService,
    ) {
        $this->middleware('permission:remittances.edit')->only(['store']);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = Validator::make($request->all(), [
            'file' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ])->validate();

        $file = $validated['file'];
        $result = $this->uploadService->store($file);

        return response()->json([
            'url' => $result['url'],
        ], 201);
    }
}
