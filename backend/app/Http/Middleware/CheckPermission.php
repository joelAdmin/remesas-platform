<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = auth('api')->user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $has = DB::table('role_permissions')
            ->where('role', $user->role)
            ->whereIn('permission_id', function ($q) use ($permission) {
                $q->select('id')->from('permissions')->where('name', $permission);
            })
            ->exists();

        if (!$has) {
            return response()->json(['error' => 'Forbidden: insufficient permissions'], 403);
        }

        return $next($request);
    }
}
