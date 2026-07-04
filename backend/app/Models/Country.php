<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'currency_code', 'currency_symbol', 'phone_code', 'flag_icon'];

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }
}
