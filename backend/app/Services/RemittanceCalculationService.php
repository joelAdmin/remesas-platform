<?php

namespace App\Services;

use App\Contracts\Repositories\CommissionRuleRepositoryInterface;
use App\Models\ExchangeCorridor;

class RemittanceCalculationService
{
    public function __construct(
        private readonly CommissionRuleRepositoryInterface $commissionRuleRepository,
    ) {}

    public function calculate(
        float $originAmount,
        float $buyRate,
        float $sellRate,
        float $originCommissionPercent,
        float $originCommissionFixed,
        float $destinationCommissionPercent,
        float $destinationCommissionFixed,
        float $tasaPublico = 0,
        string $tasaFormula = 'divide',
    ): array {
        $originCommissionTotal = $originAmount * ($originCommissionPercent / 100) + $originCommissionFixed;
        $originNetAmount = $originAmount - $originCommissionTotal;
        $usdtBought = $buyRate > 0 ? $originNetAmount / $buyRate : 0;

        $destinationNetAmount = match ($tasaFormula) {
            'multiply' => $tasaPublico > 0 ? $originAmount * $tasaPublico : 0,
            default => $tasaPublico > 0 ? $originAmount / $tasaPublico : 0,
        };
        $destPct = $destinationCommissionPercent / 100;
        $destinationGrossAmount = $destPct < 1
            ? ($destinationNetAmount + $destinationCommissionFixed) / (1 - $destPct)
            : $destinationNetAmount + $destinationCommissionFixed;
        $destinationCommissionTotal = $destinationGrossAmount - $destinationNetAmount;

        $usdtToSell = match ($tasaFormula) {
            'multiply' => $sellRate > 0 ? $destinationNetAmount / $sellRate : 0,
            default => $sellRate > 0 ? $destinationGrossAmount / $sellRate : 0,
        };
        $profitUsdt = $usdtBought - $usdtToSell;
        $totalProfitUsd = $profitUsdt + ($originCommissionTotal / max($buyRate, 0.0001)) + ($destinationCommissionTotal / max($sellRate, 0.0001));

        return [
            'origin_commission_percent' => round($originCommissionPercent, 2),
            'origin_commission_fixed' => round($originCommissionFixed, 2),
            'origin_commission_total' => round($originCommissionTotal, 2),
            'origin_net_amount' => round($originNetAmount, 2),
            'usdt_bought' => round($usdtBought, 2),
            'destination_commission_percent' => round($destinationCommissionPercent, 2),
            'destination_commission_fixed' => round($destinationCommissionFixed, 2),
            'destination_gross_amount' => round($destinationGrossAmount, 2),
            'destination_commission_total' => round($destinationCommissionTotal, 2),
            'destination_net_amount' => round($destinationNetAmount, 2),
            'usdt_to_sell' => round($usdtToSell, 2),
            'profit_usdt' => round($profitUsdt, 2),
            'total_profit_usd' => round($totalProfitUsd, 2),
            'tasa_formula' => $tasaFormula,
        ];
    }

    public function calculateForCorridor(
        float $originAmount,
        float $buyRate,
        float $sellRate,
        int $exchangeCorridorId,
        float $tasaPublico = 0,
    ): array {
        $corridor = ExchangeCorridor::find($exchangeCorridorId);
        $tasaFormula = $corridor?->tasa_formula ?? 'divide';

        $rules = $this->commissionRuleRepository->findActiveByCorridor($exchangeCorridorId);

        $originPercent = 0;
        $originFixed = 0;
        $destinationPercent = 0;
        $destinationFixed = 0;

        foreach ($rules as $rule) {
            $percent = (float) $rule->percent;
            $fixed = (float) $rule->fixed_amount;
            if ($rule->applies_to === 'origin') {
                $originPercent += $percent;
                $originFixed += $fixed;
            } else {
                $destinationPercent += $percent;
                $destinationFixed += $fixed;
            }
        }

        return $this->calculate(
            originAmount: $originAmount,
            buyRate: $buyRate,
            sellRate: $sellRate,
            originCommissionPercent: $originPercent,
            originCommissionFixed: $originFixed,
            destinationCommissionPercent: $destinationPercent,
            destinationCommissionFixed: $destinationFixed,
            tasaPublico: $tasaPublico,
            tasaFormula: $tasaFormula,
        );
    }

    public function calculateResponsibleProfit(float $totalProfitUsd, float $assignedPercent): float
    {
        return round($totalProfitUsd * ($assignedPercent / 100), 2);
    }
}
