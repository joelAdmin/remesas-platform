<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:permissions.manage')->only(['index', 'rolePermissions', 'updateRolePermissions']);
    }

    public function index(): JsonResponse
    {
        $permissions = Permission::orderBy('module')->orderBy('name')->get();
        $grouped = $permissions->groupBy('module');
        return response()->json(['data' => $grouped]);
    }

    public function rolePermissions(string $role): JsonResponse
    {
        $ids = RolePermission::where('role', $role)->pluck('permission_id');
        return response()->json(['data' => $ids]);
    }

    public function updateRolePermissions(Request $request, string $role): JsonResponse
    {
        $request->validate([
            'permission_ids' => 'present|array',
            'permission_ids.*' => 'integer|exists:permissions,id',
        ]);

        RolePermission::where('role', $role)->delete();

        $rows = array_map(fn ($id) => [
            'role' => $role,
            'permission_id' => $id,
            'created_at' => now(),
            'updated_at' => now(),
        ], $request->permission_ids);

        if (!empty($rows)) {
            RolePermission::insert($rows);
        }

        return response()->json(['message' => 'Permissions updated']);
    }

    public function myPermissions(): JsonResponse
    {
        $user = auth('api')->user();
        $permissions = Permission::whereIn('id', function ($q) use ($user) {
            $q->select('permission_id')
                ->from('role_permissions')
                ->where('role', $user->role);
        })->pluck('name');

        return response()->json(['data' => $permissions]);
    }
}
