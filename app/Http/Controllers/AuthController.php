<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Local Login: Authenticate directly against the local CockroachDB database.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $localUser = User::where('email', $request->email)->first();

        if (!$localUser || !\Illuminate\Support\Facades\Hash::check($request->password, $localUser->password)) {
            return response()->json([
                'message' => 'Email atau password salah.'
            ], 401);
        }

        if ($localUser->role !== 'admin' && $localUser->role !== 'pengawas' && !$localUser->is_approved) {
            return response()->json([
                'message' => 'Akun Anda belum disetujui oleh Admin. Silakan tunggu.'
            ], 403);
        }

        // Create local Sanctum token
        $token = $localUser->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $localUser->id,
                'name' => $localUser->name,
                'email' => $localUser->email,
                'role' => $localUser->role,
            ]
        ], 200);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
            'role' => 'guru', // Default role is guru
            'is_approved' => false,
        ]);

        return response()->json([
            'message' => 'Pendaftaran berhasil. Silakan tunggu persetujuan Admin.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_approved' => $user->is_approved,
            ]
        ], 201);
    }

    /**
     * True SSO: Verify token from Absensi frontend.
     */
    public function verifySso(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $absensiUrl = rtrim(env('BACKEND_ABSENSI_URL', 'http://localhost:8001'), '/');

        try {
            // Call Absensi backend to get user details using the provided token
            $response = Http::withToken($request->token)
                ->timeout(15)
                ->get($absensiUrl . '/api/user');
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Tidak dapat memverifikasi token ke server absensi.'
            ], 503);
        }

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Token SSO tidak valid atau sudah kadaluarsa.'
            ], 401);
        }

        $absensiUser = $response->json();

        // 3. Map Absensi role to Arsip Modul Pembelajaran role
        $absensiRole = $absensiUser['role'] ?? 'guru_mapel';
        $modulRole = $this->mapRole($absensiRole);

        // 4. Block roles that shouldn't access Arsip Modul Pembelajaran (e.g. sarpras)
        if ($modulRole === null) {
            return response()->json([
                'message' => 'Akun Anda tidak memiliki akses ke sistem Arsip Modul Pembelajaran.'
            ], 403);
        }

        // 5. Fetch local user (since DB is shared, they already exist)
        $localUser = User::where('email', $absensiUser['email'])->first();

        if (!$localUser) {
            return response()->json(['message' => 'User tidak ditemukan di database lokal.'], 404);
        }

        // 6. Validasi Sumber Akun (Khusus Arsip Modul Pembelajaran / Admin)
        $userApp = $localUser->app_source ?? 'absensi';
        if ($localUser->role !== 'admin' && $userApp !== 'storing') {
            return response()->json([
                'message' => 'Akun ini terdaftar untuk Web Absensi dan tidak dapat digunakan pada Web Arsip Modul Pembelajaran.'
            ], 403);
        }

        // 7. Create local Sanctum token
        $token = $localUser->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login SSO berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $localUser->id,
                'name' => $localUser->name,
                'email' => $localUser->email,
                'role' => $modulRole,
                'app_source' => $userApp,
                'nrg' => $localUser->nrg,
            ]
        ], 200);
    }

    /**
     * Logout: Revoke current token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil'
        ], 200);
    }

    /**
     * Map Absensi role to Arsip Modul Pembelajaran role.
     * Returns null if the role should not have access.
     */
    private function mapRole(string $absensiRole): ?string
    {
        return match ($absensiRole) {
            'admin' => 'admin',
            'wali_kelas', 'guru_mapel', 'guru' => 'guru',
            default => null, // sarpras and other roles are blocked
        };
    }
}