<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PermissionSeeder extends Seeder
{
    private array $modules = [
        'dashboard'       => ['view'],
        'remittances'     => ['view', 'create', 'edit', 'delete'],
        'clients'         => ['view', 'create', 'edit', 'delete'],
        'client-accounts' => ['view', 'create', 'edit', 'delete'],
        'source-accounts' => ['view', 'create', 'edit', 'delete'],
        'countries'       => ['view', 'create', 'edit', 'delete'],
        'currencies'      => ['view', 'create', 'edit', 'delete'],
        'exchange-corridors' => ['view', 'create', 'edit', 'delete'],
        'users'           => ['view', 'create', 'edit', 'delete'],
        'commission-rules' => ['view', 'create', 'edit', 'delete'],
        'profit-sharing-rules' => ['view', 'create', 'edit', 'delete'],
        'promoter-goals'  => ['view', 'create', 'edit', 'delete'],
        'promoter-commissions' => ['view', 'create', 'edit', 'delete'],
        'bank-accounts'   => ['view', 'create', 'edit', 'delete'],
        'permissions'     => ['manage'],
    ];

    private array $rolePermissions = [
        'admin' => [
            'dashboard' => ['view'],
            'remittances' => ['view', 'create', 'edit', 'delete'],
            'clients' => ['view', 'create', 'edit', 'delete'],
            'client-accounts' => ['view', 'create', 'edit', 'delete'],
            'source-accounts' => ['view', 'create', 'edit', 'delete'],
            'countries' => ['view', 'create', 'edit', 'delete'],
            'currencies' => ['view', 'create', 'edit', 'delete'],
            'exchange-corridors' => ['view', 'create', 'edit', 'delete'],
            'users' => ['view', 'create', 'edit', 'delete'],
            'commission-rules' => ['view', 'create', 'edit', 'delete'],
            'profit-sharing-rules' => ['view', 'create', 'edit', 'delete'],
            'promoter-goals' => ['view', 'create', 'edit', 'delete'],
            'promoter-commissions' => ['view', 'create', 'edit', 'delete'],
            'bank-accounts' => ['view', 'create', 'edit', 'delete'],
            'permissions' => ['manage'],
        ],
        'owner' => [
            'dashboard' => ['view'],
            'remittances' => ['view', 'create', 'edit', 'delete'],
            'clients' => ['view', 'create', 'edit', 'delete'],
            'client-accounts' => ['view', 'create', 'edit', 'delete'],
            'source-accounts' => ['view', 'create', 'edit', 'delete'],
            'countries' => ['view', 'create', 'edit', 'delete'],
            'currencies' => ['view', 'create', 'edit', 'delete'],
            'exchange-corridors' => ['view', 'create', 'edit', 'delete'],
            'users' => ['view', 'create', 'edit', 'delete'],
            'commission-rules' => ['view', 'create', 'edit', 'delete'],
            'profit-sharing-rules' => ['view', 'create', 'edit', 'delete'],
            'promoter-goals' => ['view', 'create', 'edit', 'delete'],
            'promoter-commissions' => ['view', 'create', 'edit', 'delete'],
            'bank-accounts' => ['view', 'create', 'edit', 'delete'],
            'permissions' => ['manage'],
        ],
        'operator' => [
            'dashboard' => ['view'],
            'remittances' => ['view', 'create', 'edit'],
            'clients' => ['view', 'create', 'edit'],
            'client-accounts' => ['view', 'create', 'edit'],
            'source-accounts' => ['view'],
            'countries' => ['view'],
            'currencies' => ['view'],
            'exchange-corridors' => ['view'],
            'bank-accounts' => ['view'],
        ],
        'promoter' => [
            'dashboard' => ['view'],
            'remittances' => ['view'],
            'promoter-goals' => ['view', 'create'],
        ],
    ];

    public function run(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        RolePermission::truncate();
        Permission::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1');

        foreach ($this->modules as $module => $actions) {
            foreach ($actions as $action) {
                $name = "$module.$action";
                $label = match ($action) {
                    'view' => "Ver $module",
                    'create' => "Crear $module",
                    'edit' => "Editar $module",
                    'delete' => "Eliminar $module",
                    'manage' => "Gestionar $module",
                    default => $action,
                };
                Permission::create([
                    'name' => $name,
                    'label' => $label,
                    'module' => $module,
                ]);
            }
        }

        $perms = Permission::pluck('id', 'name');

        foreach ($this->rolePermissions as $role => $modules) {
            foreach ($modules as $module => $actions) {
                foreach ($actions as $action) {
                    $name = "$module.$action";
                    if (isset($perms[$name])) {
                        RolePermission::create([
                            'role' => $role,
                            'permission_id' => $perms[$name],
                        ]);
                    }
                }
            }
        }
    }
}
