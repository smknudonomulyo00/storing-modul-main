<?php

namespace App\Http\Controllers;

use App\Models\JurnalMengajar;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Http\Request;

class JurnalMengajarController extends Controller
{
    private function rules(): array
    {
        return [
            'mapel_id' => 'required|exists:mapels,id',
            'kelas' => 'required|string|max:10',
            'jurusan' => 'required|string|max:20',
            'tanggal' => 'required|date',
            'pertemuan_ke' => 'nullable|string|max:10',
            'jam_ke' => 'nullable|string|max:20',
            'materi' => 'required|string|max:255',
            'uraian_kegiatan' => 'nullable|string',
            'sakit' => 'nullable|integer|min:0|max:999',
            'izin' => 'nullable|integer|min:0|max:999',
            'alpha' => 'nullable|integer|min:0|max:999',
            'terlambat' => 'nullable|integer|min:0|max:999',
            'keterangan' => 'nullable|string',
        ];
    }

    private function semesterFromDate($tanggal): string
    {
        // Juli - Desember = Ganjil, Januari - Juni = Genap
        return Carbon::parse($tanggal)->month >= 7 ? 'Ganjil' : 'Genap';
    }

    private function normalize(array $data): array
    {
        foreach (['sakit', 'izin', 'alpha', 'terlambat'] as $k) {
            $data[$k] = (int) ($data[$k] ?? 0);
        }
        $data['semester'] = $this->semesterFromDate($data['tanggal']);
        return $data;
    }

    /** Daftar jurnal milik guru yang login (opsional filter mapel_id, kelas, jurusan). */
    public function index(Request $request)
    {
        $query = JurnalMengajar::with('mapel:id,nama_mapel')
            ->where('user_id', $request->user()->id);

        foreach (['mapel_id', 'kelas', 'jurusan', 'tahun_ajaran'] as $f) {
            if ($request->filled($f)) {
                $query->where($f, $request->input($f));
            }
        }

        return response()->json([
            'data' => $query->orderBy('tanggal', 'asc')->orderBy('id', 'asc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $this->normalize($request->validate($this->rules()));
        $setting = Setting::where('key', 'tahun_ajaran_aktif')->first();

        $data['user_id'] = $request->user()->id;
        $data['tahun_ajaran'] = $setting ? $setting->value : '2025/2026';

        $jurnal = JurnalMengajar::create($data);

        return response()->json([
            'message' => 'Jurnal mengajar berhasil disimpan!',
            'data' => $jurnal->load('mapel:id,nama_mapel'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $jurnal = JurnalMengajar::where('user_id', $request->user()->id)->findOrFail($id);
        $jurnal->update($this->normalize($request->validate($this->rules())));

        return response()->json([
            'message' => 'Jurnal mengajar berhasil diperbarui!',
            'data' => $jurnal->load('mapel:id,nama_mapel'),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $jurnal = JurnalMengajar::where('user_id', $request->user()->id)->findOrFail($id);
        $jurnal->delete();

        return response()->json(['message' => 'Jurnal mengajar berhasil dihapus!']);
    }
}
