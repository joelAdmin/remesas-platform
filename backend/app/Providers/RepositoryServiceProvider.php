<?php

namespace App\Providers;

use App\Contracts\Repositories\{
    ClientRepositoryInterface,
    CommissionRuleRepositoryInterface,
    CountryRepositoryInterface,
    CurrencyRepositoryInterface,
    ExchangeCorridorRepositoryInterface,
    ProfitSharingRuleRepositoryInterface,
    PromoterCommissionRepositoryInterface,
    PromoterGoalRepositoryInterface,
    RemittancePromoterRepositoryInterface,
    RemittanceRepositoryInterface,
    UserRepositoryInterface,
    WorkCycleRepositoryInterface,
};
use App\Repositories\{
    ClientRepository,
    CommissionRuleRepository,
    CountryRepository,
    CurrencyRepository,
    ExchangeCorridorRepository,
    ProfitSharingRuleRepository,
    PromoterCommissionRepository,
    PromoterGoalRepository,
    RemittancePromoterRepository,
    RemittanceRepository,
    UserRepository,
    WorkCycleRepository,
};
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(CountryRepositoryInterface::class, CountryRepository::class);
        $this->app->bind(CurrencyRepositoryInterface::class, CurrencyRepository::class);
        $this->app->bind(ExchangeCorridorRepositoryInterface::class, ExchangeCorridorRepository::class);
        $this->app->bind(ClientRepositoryInterface::class, ClientRepository::class);
        $this->app->bind(CommissionRuleRepositoryInterface::class, CommissionRuleRepository::class);
        $this->app->bind(ProfitSharingRuleRepositoryInterface::class, ProfitSharingRuleRepository::class);
        $this->app->bind(RemittanceRepositoryInterface::class, RemittanceRepository::class);
        $this->app->bind(PromoterGoalRepositoryInterface::class, PromoterGoalRepository::class);
        $this->app->bind(PromoterCommissionRepositoryInterface::class, PromoterCommissionRepository::class);
        $this->app->bind(RemittancePromoterRepositoryInterface::class, RemittancePromoterRepository::class);
        $this->app->bind(WorkCycleRepositoryInterface::class, WorkCycleRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
