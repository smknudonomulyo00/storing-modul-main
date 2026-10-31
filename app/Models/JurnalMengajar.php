<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JurnalMengajar extends Model
{
    protected $table = 'jurnal_mengajars';

    protected $keyType = 'string';

    protected $fillable = [
        'user_id', 'mapel_id', 'tahun_ajaran', 'semester', 'kelas', 'jurusan',
        'tanggal', 'pertemuan_ke', 'jam_ke', 'materi', 'uraian_kegiatan',
        'sakit', 'izin', 'alpha', 'terlambat', 'keterangan',
    ];

    protected $casts = [
        'id' => 'string',
        'user_id' => 'string',
        'mapel_id' => 'string',
        'tanggal' => 'date:Y-m-d',
        'sakit' => 'integer',
        'izin' => 'integer',
        'alpha' => 'integer',
        'terlambat' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function mapel()
    {
        return $this->belongsTo(Mapel::class);
    }
}
