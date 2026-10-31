<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        Schema::create('jurnal_mengajars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // Guru pengisi
            $table->foreignId('mapel_id')->constrained('mapels')->cascadeOnDelete(); // Relasi ke Mapel
            $table->string('tahun_ajaran', 20);
            $table->string('semester', 10); // Ganjil / Genap (otomatis dari tanggal)
            $table->string('kelas', 10);
            $table->string('jurusan', 20);
            $table->date('tanggal');
            $table->string('pertemuan_ke', 10)->nullable();
            $table->string('jam_ke', 20)->nullable();
            $table->string('materi');
            $table->text('uraian_kegiatan')->nullable();
            $table->unsignedSmallInteger('sakit')->default(0);
            $table->unsignedSmallInteger('izin')->default(0);
            $table->unsignedSmallInteger('alpha')->default(0);
            $table->unsignedSmallInteger('terlambat')->default(0);
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'mapel_id', 'tanggal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('jurnal_mengajars');
    }
};
