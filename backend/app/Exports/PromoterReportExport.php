<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PromoterReportExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(private Collection $data) {}

    public function collection(): Collection
    {
        return $this->data;
    }

    public function headings(): array
    {
        return ['Promotor', 'Remesas', '% Total', 'Ganancia USDT'];
    }

    public function map($row): array
    {
        return [
            $row['user_name'],
            $row['remittance_count'],
            $row['total_percent_sum'],
            $row['total_earnings_usdt'],
        ];
    }
}
