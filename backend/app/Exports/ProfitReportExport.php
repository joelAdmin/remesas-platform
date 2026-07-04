<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProfitReportExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(private Collection $data) {}

    public function collection(): Collection
    {
        return $this->data;
    }

    public function headings(): array
    {
        return ['Fecha', 'Cantidad Remesas', 'Ganancia USDT', 'Ganancia USD', 'Monto Origen'];
    }

    public function map($row): array
    {
        return [
            $row->date,
            $row->count,
            round((float) $row->profit_usdt, 2),
            round((float) $row->profit_usd, 2),
            round((float) $row->origin_amount, 2),
        ];
    }
}
