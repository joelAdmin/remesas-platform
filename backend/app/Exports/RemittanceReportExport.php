<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class RemittanceReportExport implements FromCollection, WithHeadings, WithMapping
{
    public function __construct(private Collection $data) {}

    public function collection(): Collection
    {
        return $this->data;
    }

    public function headings(): array
    {
        return [
            'Referencia', 'Cliente', 'Corredor', 'Monto Origen',
            'Tasa Compra', 'Tasa Venta', 'Ganancia USDT', 'Ganancia USD',
            'Estado', 'Ciclo', 'Fecha',
        ];
    }

    public function map($row): array
    {
        return [
            $row['ref_ve'],
            $row['cliente'],
            $row['corredor'],
            $row['monto_origen'],
            $row['tasa_compra'],
            $row['tasa_venta'],
            $row['ganancia_usdt'],
            $row['ganancia_usd'],
            $row['estado'],
            $row['ciclo'],
            $row['fecha'],
        ];
    }
}
