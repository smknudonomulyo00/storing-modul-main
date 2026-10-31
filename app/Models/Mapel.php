<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mapel extends Model
{
    protected $fillable = [
        'nama_mapel',
        'tingkat_kelas',
        'jurusan',
    ];

    protected $keyType = 'string';

    protected $casts = [
        'id' => 'string',
    ];
}
