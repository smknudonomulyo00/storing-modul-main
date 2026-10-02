<?php

namespace App\Http\Controllers;

use App\Models\Modul;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ModulController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (in_array($user->role, ['guru', 'guru_mapel', 'wali_kelas'])) {
            $moduls = Modul::with(['user', 'mapelRelation', 'catatanRevisis'])->where('user_id', $user->id)->get();
        } else {
            $moduls = Modul::with(['user', 'mapelRelation', 'catatanRevisis'])->get();
        }

        return response()->json([
            'message' => 'Berhasil mengambil data arsip',
            'data' => $moduls
        ], 200);
    }

    public function review(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:ACC,Revisi,Pending,acc,revisi,pending',
            'catatan_revisi' => 'nullable|string',
        ]);

        $modul = Modul::findOrFail($id);
        $modul->status = $request->status; // automatically lowercased by mutator
        $modul->save();

        if ($request->filled('catatan_revisi')) {
            $modul->catatanRevisis()->create([
                'pengawas_id' => Auth::id(),
                'catatan' => $request->catatan_revisi,
            ]);
        }

        return response()->json([
            'message' => 'Tinjauan dokumen berhasil disimpan!',
            'data' => $modul->load(['user', 'mapelRelation', 'catatanRevisis'])
        ], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'judul' => 'required|string|max:255',
            'mapel_id' => 'required|exists:mapels,id',
            'jenis_perangkat' => 'required|string|max:100',
            'file_pdf' => 'required|mimes:pdf,doc,docx,xls,xlsx,ppt,pptx|max:10240',
            'tahun_ajaran' => 'nullable|string|max:20',
            'kelas' => 'nullable|string|max:10',
            'jurusan' => 'nullable|string|max:50',
        ]);

        $file = $request->file('file_pdf');
        $cloudinaryUrl = env('CLOUDINARY_URL');

        if ($cloudinaryUrl) {
            // Upload to Cloudinary using direct REST API
            $parsed = parse_url($cloudinaryUrl);
            $apiKey = $parsed['user'] ?? '';
            $apiSecret = $parsed['pass'] ?? '';
            $cloudName = $parsed['host'] ?? '';

            $timestamp = time();
            $signature = sha1("timestamp=" . $timestamp . $apiSecret);

            $response = \Illuminate\Support\Facades\Http::attach(
                'file', file_get_contents($file->getRealPath()), $file->getClientOriginalName()
            )->post('https://api.cloudinary.com/v1_1/' . $cloudName . '/auto/upload', [
                'api_key' => $apiKey,
                'timestamp' => $timestamp,
                'signature' => $signature
            ]);

            if ($response->successful()) {
                $path = $response->json('secure_url');
            } else {
                return response()->json(['message' => 'Gagal upload file ke Cloudinary.'], 500);
            }
        } else {
            // Fallback to local storage if Cloudinary is not configured
            $path = $file->store('arsip_dokumen', 'public');
        }

        $isAdmin = in_array(Auth::user()->role, ['admin', 'pengawas']);
        $jurusan = $request->jurusan;

        // Jika jurusan = 'semua', buat 3 record (TKR, DKV, LPKC)
        if ($jurusan === 'semua') {
            $jurusanList = ['TKR', 'DKV', 'LPKC'];
            $createdModuls = [];

            foreach ($jurusanList as $j) {
                $createdModuls[] = Modul::create([
                    'user_id' => Auth::id(),
                    'mapel_id' => $request->mapel_id,
                    'judul' => $request->judul,
                    'jenis_perangkat' => $request->jenis_perangkat,
                    'file_pdf_path' => $path,
                    'status' => $isAdmin ? 'acc' : 'pending',
                    'tahun_ajaran' => $request->tahun_ajaran,
                    'kelas' => $request->kelas,
                    'jurusan' => $j,
                ]);
            }

            return response()->json([
                'message' => 'Dokumen berhasil diunggah ke semua jurusan!',
                'data' => $createdModuls
            ], 201);
        }

        $modul = Modul::create([
            'user_id' => Auth::id(),
            'mapel_id' => $request->mapel_id,
            'judul' => $request->judul,
            'jenis_perangkat' => $request->jenis_perangkat,
            'file_pdf_path' => $path,
            'status' => $isAdmin ? 'acc' : 'pending',
            'tahun_ajaran' => $request->tahun_ajaran,
            'kelas' => $request->kelas,
            'jurusan' => $jurusan,
        ]);

        return response()->json([
            'message' => 'Dokumen berhasil diunggah!',
            'data' => $modul
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $modul = Modul::findOrFail($id);

        $isAdmin = in_array($user->role, ['admin', 'pengawas']);
        $isOwner = (string)$modul->user_id === (string)$user->id;

        if (!$isAdmin && !$isOwner) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk mengubah perangkat milik pengguna lain.'], 403);
        }

        $request->validate([
            'judul' => 'required|string|max:255',
            'mapel_id' => 'required|exists:mapels,id',
            'jenis_perangkat' => 'required|string|max:100',
            'file_pdf' => 'nullable|mimes:pdf,doc,docx,xls,xlsx|max:10240', 
        ]);

        if ($request->hasFile('file_pdf')) {
            $file = $request->file('file_pdf');
            $oldFilePath = $modul->file_pdf_path;
            $cloudinaryUrl = env('CLOUDINARY_URL');

            if ($cloudinaryUrl) {
                $parsed = parse_url($cloudinaryUrl);
                $apiKey = $parsed['user'] ?? '';
                $apiSecret = $parsed['pass'] ?? '';
                $cloudName = $parsed['host'] ?? '';

                $timestamp = time();
                $signature = sha1("timestamp=" . $timestamp . $apiSecret);

                $response = \Illuminate\Support\Facades\Http::attach(
                    'file', file_get_contents($file->getRealPath()), $file->getClientOriginalName()
                )->post('https://api.cloudinary.com/v1_1/' . $cloudName . '/raw/upload', [
                    'api_key' => $apiKey,
                    'timestamp' => $timestamp,
                    'signature' => $signature
                ]);

                if ($response->successful()) {
                    // Hapus file lama di Cloudinary jika upload file baru sukses
                    $this->deleteFile($oldFilePath);
                    $modul->file_pdf_path = $response->json('secure_url');
                } else {
                    return response()->json(['message' => 'Gagal upload file ke Cloudinary.'], 500);
                }
            } else {
                $this->deleteFile($oldFilePath);
                $modul->file_pdf_path = $file->store('arsip_dokumen', 'public');
            }
        }

        $modul->judul = $request->judul;
        $modul->mapel_id = $request->mapel_id;
        $modul->jenis_perangkat = strtolower($request->jenis_perangkat);
        
        // Return status back to pending if teacher edited
        if (!$isAdmin) {
            $modul->status = 'pending';
        }

        $modul->save();

        return response()->json([
            'message' => 'Data perangkat pembelajaran berhasil diperbarui!',
            'data' => $modul->load(['user', 'mapelRelation', 'catatanRevisis'])
        ], 200);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $modul = Modul::findOrFail($id);

        $isAdmin = in_array($user->role, ['admin', 'pengawas']);
        $isOwner = (string)$modul->user_id === (string)$user->id;

        if (!$isAdmin && !$isOwner) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk menghapus perangkat milik pengguna lain.'], 403);
        }

        // Hapus file fisik di Cloudinary / local storage
        $this->deleteFile($modul->file_pdf_path);

        $modul->catatanRevisis()->delete();
        $modul->delete();

        return response()->json([
            'message' => 'Data perangkat pembelajaran berhasil dihapus!'
        ], 200);
    }

    /**
     * Helper untuk menghapus file fisik di Cloudinary maupun local storage
     */
    private function deleteFile(?string $filePath): void
    {
        if (empty($filePath)) {
            return;
        }

        if (str_contains($filePath, 'res.cloudinary.com')) {
            $this->deleteCloudinaryFile($filePath);
        } elseif (str_starts_with($filePath, 'arsip_dokumen/') || str_contains($filePath, 'storage/arsip_dokumen/')) {
            $cleanPath = str_replace(['storage/', '/storage/'], '', $filePath);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($cleanPath);
        }
    }

    /**
     * Helper untuk menghapus aset di Cloudinary via Destroy REST API
     */
    private function deleteCloudinaryFile(string $fileUrl): void
    {
        $cloudinaryUrl = env('CLOUDINARY_URL');
        if (!$cloudinaryUrl) {
            return;
        }

        try {
            $parsed = parse_url($cloudinaryUrl);
            $apiKey = $parsed['user'] ?? '';
            $apiSecret = $parsed['pass'] ?? '';
            $cloudName = $parsed['host'] ?? '';

            if (!$apiKey || !$apiSecret || !$cloudName) {
                return;
            }

            // Extract resource_type and file path from URL
            if (preg_match('#/(image|raw|video)/upload/(?:v\d+/)?(.+)$#', $fileUrl, $matches)) {
                $resourceType = $matches[1];
                $fullPath = $matches[2];

                $filenameWithoutExt = pathinfo($fullPath, PATHINFO_FILENAME);

                // Candidates for public_id to destroy
                $publicIds = array_unique([$fullPath, $filenameWithoutExt]);
                $typesToTry = array_unique([$resourceType, 'raw', 'image']);

                foreach ($typesToTry as $type) {
                    foreach ($publicIds as $pubId) {
                        $timestamp = time();
                        $signature = sha1("public_id={$pubId}&timestamp={$timestamp}{$apiSecret}");

                        \Illuminate\Support\Facades\Http::asForm()->post("https://api.cloudinary.com/v1_1/{$cloudName}/{$type}/destroy", [
                            'public_id' => $pubId,
                            'api_key' => $apiKey,
                            'timestamp' => $timestamp,
                            'signature' => $signature,
                        ]);
                    }
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Gagal menghapus file Cloudinary: ' . $e->getMessage());
        }
    }
}