<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('id', '!=', auth()->id() ?? 0)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'role', 'is_approved', 'created_at'])
            ->map(function ($user) {
                $user->status = $user->is_approved ? 'active' : 'pending';
                return $user;
            });

        return response()->json([
            'message' => 'Berhasil mengambil daftar akun.',
            'data' => $users
        ], 200);
    }

    /**
     * Daftar akun guru yang belum diapprove
     */
    public function pendingUsers()
    {
        $users = User::where('is_approved', false)
            ->where('role', 'guru')
            ->orderBy('created_at', 'desc')
            ->get(['id', 'name', 'email', 'role', 'is_approved', 'created_at'])
            ->map(function ($user) {
                $user->status = 'pending';
                return $user;
            });

        return response()->json([
            'message' => 'Berhasil mengambil daftar akun pending.',
            'data' => $users
        ], 200);
    }

    /**
     * Approve akun guru (ubah is_approved jadi true).
     */
    public function approve($id)
    {
        $user = User::findOrFail($id);
        $user->is_approved = true;
        $user->save();

        return response()->json([
            'message' => "Akun \"{$user->name}\" berhasil disetujui!",
            'data' => $user
        ], 200);
    }

    /**
     * Update status akun (active, inactive, pending).
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|string|in:active,inactive,pending'
        ]);

        $user = User::findOrFail($id);
        
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Status akun Admin tidak dapat diubah.'], 403);
        }

        $user->is_approved = ($request->status === 'active');
        $user->save();
        $user->status = $user->is_approved ? 'active' : 'pending';

        return response()->json([
            'message' => 'Status user berhasil diperbarui',
            'user' => $user
        ], 200);
    }

    /**
     * Reset password.
     */
    public function resetPassword($id)
    {
        $user = User::findOrFail($id);
        
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Tidak dapat mereset sandi sesama Admin.'], 403);
        }

        $defaultPassword = 'password123';
        $user->password = Hash::make($defaultPassword);
        $user->save();

        return response()->json([
            'message' => 'Sandi berhasil direset menjadi: ' . $defaultPassword
        ], 200);
    }

    /**
     * Update Role dan Nrg.
     */
    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role' => 'required|string|in:wali_kelas,guru_mapel,admin,sarpras',
            'nrg' => 'nullable|string|max:50'
        ]);

        $user = User::findOrFail($id);
        $user->role = $request->role;
        if ($request->has('nrg')) {
            $user->nrg = $request->nrg;
        }
        $user->save();

        return response()->json([
            'message' => 'Akun berhasil diperbarui',
            'user' => $user
        ], 200);
    }

    /**
     * Tolak / hapus akun guru.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Akun Admin tidak dapat dihapus.'], 403);
        }
        
        $name = $user->name;
        $user->delete();

        return response()->json([
            'message' => "Akun \"{$name}\" berhasil dihapus."
        ], 200);
    }
}
