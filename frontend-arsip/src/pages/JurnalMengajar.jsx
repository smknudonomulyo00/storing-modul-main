import React, { useEffect, useMemo, useState } from 'react';
import {
  NotebookPen, Printer, Pencil, Trash2, X, AlertCircle, CheckCircle, Filter, Plus, CalendarDays,
} from 'lucide-react';
import { jurnalService, mapelService, settingsService } from '../services/api';

const KELAS_OPTIONS = ['10', '11', '12'];
const JURUSAN_OPTIONS = ['TKR', 'DKV', 'LPKC'];
const MIN_PRINT_ROWS = 15;

const emptyForm = {
  mapel_id: '', kelas: '', jurusan: '', tanggal: new Date().toISOString().slice(0, 10),
  pertemuan_ke: '', jam_ke: '', materi: '', uraian_kegiatan: '',
  sakit: 0, izin: 0, alpha: 0, terlambat: 0, keterangan: '',
};

const formatHariTanggal = (tgl) => {
  if (!tgl) return '-';
  const d = new Date(`${String(tgl).slice(0, 10)}T00:00:00`);
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const semesterFromDate = (tgl) => (tgl && new Date(tgl).getMonth() + 1 >= 7 ? 'Ganjil' : 'Genap');

const uniq = (arr) => [...new Set(arr.filter(Boolean))];

const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all';
const labelCls = 'block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5';

export default function JurnalMengajar({ user }) {
  const [mapels, setMapels] = useState([]);
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [filterMapel, setFilterMapel] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterJurusan, setFilterJurusan] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      setRecords(await jurnalService.getMyJurnal());
    } catch (e) {
      console.warn('Gagal memuat jurnal', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mapelService.getAllMapels().then((r) => setMapels(r.data || [])).catch(() => {});
    settingsService.getActiveTahunAjaran().then((r) => setTahunAjaran(r.tahun_ajaran)).catch(() => setTahunAjaran('2025/2026'));
    loadRecords();
  }, []);

  const filtered = useMemo(() => records.filter((r) => {
    const matchMapel = !filterMapel ||
      String(r.mapel_id) === String(filterMapel) ||
      (r.mapel && String(r.mapel.id) === String(filterMapel));
    const matchKelas = !filterKelas || String(r.kelas) === String(filterKelas);
    const matchJurusan = !filterJurusan || String(r.jurusan).toLowerCase() === String(filterJurusan).toLowerCase();
    return matchMapel && matchKelas && matchJurusan;
  }), [records, filterMapel, filterKelas, filterJurusan]);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => {
    setEditId(null);
    setForm({ ...emptyForm, mapel_id: filterMapel, kelas: filterKelas, jurusan: filterJurusan });
    setError('');
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setForm({
      mapel_id: String(r.mapel_id), kelas: r.kelas, jurusan: r.jurusan,
      tanggal: String(r.tanggal).slice(0, 10), pertemuan_ke: r.pertemuan_ke || '', jam_ke: r.jam_ke || '',
      materi: r.materi || '', uraian_kegiatan: r.uraian_kegiatan || '',
      sakit: r.sakit, izin: r.izin, alpha: r.alpha, terlambat: r.terlambat, keterangan: r.keterangan || '',
    });
    setError('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mapel_id || !form.kelas || !form.jurusan) return setError('Mata Pelajaran, Kelas, dan Jurusan wajib dipilih.');
    if (!form.tanggal) return setError('Hari / Tanggal wajib diisi.');
    if (!form.materi.trim()) return setError('Materi / Tugas wajib diisi.');
    setSaving(true);
    setError('');
    try {
      if (editId) await jurnalService.updateJurnal(editId, form);
      else await jurnalService.createJurnal(form);
      setToast(editId ? 'Jurnal berhasil diperbarui!' : 'Jurnal berhasil disimpan!');
      setTimeout(() => setToast(''), 2500);
      setShowForm(false);
      setEditId(null);
      loadRecords();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan jurnal.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Hapus jurnal tanggal ${formatHariTanggal(r.tanggal)}?`)) return;
    try {
      await jurnalService.deleteJurnal(r.id);
      loadRecords();
    } catch {
      alert('Gagal menghapus jurnal.');
    }
  };

  // ===== Data header cetak =====
  const printMapel = filterMapel
    ? mapels.find((m) => String(m.id) === String(filterMapel))?.nama_mapel
    : uniq(filtered.map((r) => r.mapel?.nama_mapel)).join(', ');
  const printKelas = filterKelas || uniq(filtered.map((r) => r.kelas)).join(', ');
  const printJurusan = filterJurusan || uniq(filtered.map((r) => r.jurusan)).join(', ');
  const printTA = uniq(filtered.map((r) => r.tahun_ajaran)).join(', ') || tahunAjaran;
  const printSemester = uniq(filtered.map((r) => r.semester)).join(', ') || semesterFromDate(new Date());

  // Target total baris agar pas tepat 1 halaman A4 Landscape tanpa tumpah ke halaman 2
  const TOTAL_PRINT_ROWS = 14;
  const padRows = Math.max(0, TOTAL_PRINT_ROWS - filtered.length);

  const handlePrint = () => {
    if (!filtered.length) return alert('Tidak ada data jurnal untuk dicetak. Silakan pilih filter atau isi jurnal terlebih dahulu.');

    const originalTitle = document.title;
    const mapelName = printMapel || 'Semua Mapel';
    const kelasPart = printKelas ? `Kelas ${printKelas}` : '';
    const jurusanPart = printJurusan || '';
    const details = [mapelName, kelasPart, jurusanPart].filter(Boolean).join(' - ');

    // Set judul halaman agar saat "Save as PDF", nama file otomatis:
    // "Jurnal Mengajar - [Mapel] - Kelas [X] - [Jurusan]"
    document.title = `Jurnal Mengajar - ${details}`;

    window.print();

    setTimeout(() => {
      document.title = originalTitle;
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <style>{`
        #jurnal-print { display: none; }
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 10mm 6mm 10mm;
          }
          body * { visibility: hidden !important; }
          #jurnal-print, #jurnal-print * { visibility: visible !important; }
          #jurnal-print {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          html, body {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
        .jp {
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          font-size: 10pt;
          line-height: 1.2;
        }
        .jp table.grid {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin: 0 auto;
        }
        .jp table.grid th, .jp table.grid td {
          border: 1px solid #000;
          padding: 3px 4px;
          vertical-align: middle;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          box-sizing: border-box;
        }
        .jp table.grid th {
          text-align: center;
          font-weight: bold;
          font-size: 9.5pt;
          background-color: #fff;
        }
        .jp table.grid td {
          font-size: 9.5pt;
        }
        .jp table.grid td.c {
          text-align: center;
        }
        .jp table.grid tbody tr {
          height: 23px;
        }
        .jp thead {
          display: table-header-group;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-600/25">
            <NotebookPen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Jurnal Mengajar Digital</h1>
            <p className="text-xs text-slate-500">Catat kegiatan pembelajaran harian — Tahun Ajaran <b>{tahunAjaran || '...'}</b></p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={openNew} id="btn-tambah-jurnal"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]">
            <Plus className="w-4 h-4" /> Isi Jurnal
          </button>
          <button onClick={handlePrint} id="btn-cetak-jurnal"
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]">
            <Printer className="w-4 h-4" /> Cetak Jurnal Pembelajaran
          </button>
        </div>
      </div>

      {/* Notifikasi info tips print */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
        <span>💡 <b>Tips Cetak:</b> Pada jendela print browser (Ctrl+P), hilangkan centang <b>"Header and footers" / "Header dan footer"</b> agar tanggal, jam, dan URL sistem tidak tercetak di tepi kertas.</span>
      </div>

      {toast && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-xs">
          <CheckCircle className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">{editId ? 'Edit Jurnal Mengajar' : 'Isi Jurnal Mengajar'}</h3>
              <p className="text-xs text-slate-500">Semester otomatis: {semesterFromDate(form.tanggal)}</p>
            </div>
            <button type="button" onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nama Guru <span className="text-[10px] text-slate-400 normal-case font-normal">(otomatis)</span></label>
                <input readOnly value={user?.name || ''} className={`${inputCls} bg-slate-100 font-bold text-slate-600 cursor-not-allowed`} />
              </div>
              <div>
                <label className={labelCls}>Tahun Ajaran <span className="text-[10px] text-slate-400 normal-case font-normal">(otomatis)</span></label>
                <input readOnly value={tahunAjaran} className={`${inputCls} bg-slate-100 font-bold text-slate-600 cursor-not-allowed`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Mata Pelajaran *</label>
                <select id="jurnal-mapel" value={form.mapel_id} onChange={setField('mapel_id')} className={`${inputCls} cursor-pointer`}>
                  <option value="">-- Pilih Mapel --</option>
                  {mapels.map((m) => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Kelas *</label>
                <select id="jurnal-kelas" value={form.kelas} onChange={setField('kelas')} className={`${inputCls} cursor-pointer`}>
                  <option value="">-- Pilih Kelas --</option>
                  {KELAS_OPTIONS.map((k) => <option key={k} value={k}>Kelas {k}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Jurusan *</label>
                <select id="jurnal-jurusan" value={form.jurusan} onChange={setField('jurusan')} className={`${inputCls} cursor-pointer`}>
                  <option value="">-- Pilih Jurusan --</option>
                  {JURUSAN_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Hari / Tanggal *</label>
                <input id="jurnal-tanggal" type="date" value={form.tanggal} onChange={setField('tanggal')} className={inputCls} />
                <p className="text-[10px] text-slate-400 mt-1">{formatHariTanggal(form.tanggal)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className={labelCls}>Pertemuan Ke-</label>
                <input id="jurnal-ptm" value={form.pertemuan_ke} onChange={setField('pertemuan_ke')} placeholder="1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Jam Ke-</label>
                <input id="jurnal-jam" value={form.jam_ke} onChange={setField('jam_ke')} placeholder="5-7" className={inputCls} />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Materi / Tugas *</label>
                <input id="jurnal-materi" value={form.materi} onChange={setField('materi')} placeholder="Self Introduction" className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Uraian Kegiatan</label>
              <textarea id="jurnal-uraian" rows={3} value={form.uraian_kegiatan} onChange={setField('uraian_kegiatan')}
                placeholder="Siswa memahami ekspresi self introduction..." className={inputCls} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kehadiran (jumlah siswa)</label>
                <div className="grid grid-cols-4 gap-2">
                  {[['sakit', 'S', 'Sakit'], ['izin', 'I', 'Izin'], ['alpha', 'A', 'Alpha'], ['terlambat', 'T', 'Terlambat']].map(([k, s, full]) => (
                    <div key={k} className="text-center">
                      <input id={`jurnal-${k}`} type="number" min="0" value={form[k]} onChange={setField(k)}
                        className={`${inputCls} text-center font-bold px-2`} />
                      <span className="text-[10px] text-slate-500 font-semibold" title={full}>{s} · {full}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>Keterangan</label>
                <textarea id="jurnal-keterangan" rows={2} value={form.keterangan} onChange={setField('keterangan')} className={inputCls} />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer">Batal</button>
            <button type="submit" disabled={saving} id="btn-simpan-jurnal"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 cursor-pointer">
              {saving ? 'Menyimpan...' : editId ? 'Simpan Perubahan' : 'Simpan Jurnal'}
            </button>
          </div>
        </form>
      )}

      {/* Filter + Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Riwayat Jurnal Saya</h3>
            <p className="text-xs text-slate-500">{filtered.length} dari {records.length} catatan — yang tampil inilah yang akan dicetak</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select id="filter-mapel" value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 cursor-pointer">
              <option value="">Semua Mapel</option>
              {mapels.map((m) => (
                <option key={m.id} value={String(m.id)}>{m.nama_mapel}</option>
              ))}
            </select>
            <select id="filter-kelas" value={filterKelas} onChange={(e) => setFilterKelas(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 cursor-pointer">
              <option value="">Semua Kelas</option>
              {KELAS_OPTIONS.map((k) => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
            <select id="filter-jurusan" value={filterJurusan} onChange={(e) => setFilterJurusan(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 cursor-pointer">
              <option value="">Semua Jurusan</option>
              {JURUSAN_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
            </select>
            {(filterMapel || filterKelas || filterJurusan) && (
              <button
                type="button"
                onClick={() => { setFilterMapel(''); setFilterKelas(''); setFilterJurusan(''); }}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-3 text-left">No</th>
                <th className="px-3 py-3 text-left">Hari, Tanggal</th>
                <th className="px-3 py-3 text-left">Mapel / Kelas</th>
                <th className="px-3 py-3 text-center">Ptm</th>
                <th className="px-3 py-3 text-center">Jam</th>
                <th className="px-3 py-3 text-left">Materi / Tugas</th>
                <th className="px-3 py-3 text-left">Uraian Kegiatan</th>
                <th className="px-3 py-3 text-center">S / I / A / T</th>
                <th className="px-3 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10 text-slate-400">Memuat...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />Belum ada jurnal.
                </td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className="hover:bg-indigo-50/40 transition-colors">
                  <td className="px-3 py-3 text-slate-400 font-bold">{i + 1}</td>
                  <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{formatHariTanggal(r.tanggal)}</td>
                  <td className="px-3 py-3">
                    <div className="font-semibold text-slate-700">{r.mapel?.nama_mapel}</div>
                    <div className="text-[10px] text-slate-400">Kelas {r.kelas} · {r.jurusan}</div>
                  </td>
                  <td className="px-3 py-3 text-center">{r.pertemuan_ke || '-'}</td>
                  <td className="px-3 py-3 text-center">{r.jam_ke || '-'}</td>
                  <td className="px-3 py-3 text-slate-700">{r.materi}</td>
                  <td className="px-3 py-3 text-slate-500 max-w-xs truncate" title={r.uraian_kegiatan}>{r.uraian_kegiatan || '-'}</td>
                  <td className="px-3 py-3 text-center font-mono">{r.sakit}/{r.izin}/{r.alpha}/{r.terlambat}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(r)} title="Edit" className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-100 cursor-pointer"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(r)} title="Hapus" className="p-2 rounded-lg text-rose-500 hover:bg-rose-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= PRINT AREA (A4 Landscape - 1 HALAMAN PAS) ================= */}
      <div id="jurnal-print" className="jp">
        {/* Kop Surat dengan Logo SMK NU */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '6px' }}>
          <img
            src="/IMG_03611.png"
            alt="Logo SMK NU"
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11pt', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: '1.2' }}>
              JURNAL MENGAJAR GURU
            </div>
            <div style={{ fontSize: '13pt', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: '1.2' }}>
              SMK NAHDLATUL ULAMA DONOMULYO
            </div>
          </div>
        </div>

        <div style={{ borderBottom: '2.5px solid #000', marginBottom: '8px' }} />

        {/* Informasi Jurnal */}
        <table style={{ width: '100%', marginBottom: '8px', fontWeight: 'bold', fontSize: '10pt', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ width: '15%', padding: '1px 0' }}>Nama Guru</td>
              <td style={{ width: '37%', padding: '1px 0' }}>: {user?.name || '-'}</td>
              <td style={{ width: '20%', padding: '1px 0' }}>Kelas / Jurusan</td>
              <td style={{ width: '28%', padding: '1px 0' }}>: {printKelas ? `Kelas ${printKelas}` : '-'} / {printJurusan || '-'}</td>
            </tr>
            <tr>
              <td style={{ padding: '1px 0' }}>Mata Pelajaran</td>
              <td style={{ padding: '1px 0' }}>: {printMapel || '-'}</td>
              <td style={{ padding: '1px 0' }}>Tahun Ajaran / Semester</td>
              <td style={{ padding: '1px 0' }}>: {printTA || '-'} / {printSemester || '-'}</td>
            </tr>
          </tbody>
        </table>

        {/* Tabel Utama: Presisi 11 Kolom Sejajar dengan colgroup */}
        <table className="grid">
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '14%' }} />
          </colgroup>
          <thead>
            <tr>
              <th rowSpan={2}>No</th>
              <th rowSpan={2}>Hari, Tanggal</th>
              <th rowSpan={2}>Ptm<br/>Ke-</th>
              <th rowSpan={2}>Jam<br/>Ke-</th>
              <th rowSpan={2}>Materi / Tugas</th>
              <th rowSpan={2}>Uraian Kegiatan</th>
              <th colSpan={4}>Kehadiran</th>
              <th rowSpan={2}>Keterangan</th>
            </tr>
            <tr>
              <th>S</th>
              <th>I</th>
              <th>A</th>
              <th>T</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id}>
                <td className="c">{i + 1}.</td>
                <td style={{ verticalAlign: 'top' }}>{formatHariTanggal(r.tanggal)}</td>
                <td className="c" style={{ verticalAlign: 'top' }}>{r.pertemuan_ke || ''}</td>
                <td className="c" style={{ verticalAlign: 'top' }}>{r.jam_ke || ''}</td>
                <td style={{ verticalAlign: 'top' }}>{r.materi}</td>
                <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{r.uraian_kegiatan || ''}</td>
                <td className="c" style={{ verticalAlign: 'top' }}>{r.sakit || ''}</td>
                <td className="c" style={{ verticalAlign: 'top' }}>{r.izin || ''}</td>
                <td className="c" style={{ verticalAlign: 'top' }}>{r.alpha || ''}</td>
                <td className="c" style={{ verticalAlign: 'top' }}>{r.terlambat || ''}</td>
                <td style={{ verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{r.keterangan || ''}</td>
              </tr>
            ))}
            {Array.from({ length: padRows }).map((_, i) => (
              <tr key={`pad-${i}`}>
                <td className="c">&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tanda Tangan: Pas di Bagian Kanan Bawah Halaman Pertama */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', pageBreakInside: 'avoid' }}>
          <div style={{ textAlign: 'left', minWidth: '210px', fontSize: '10pt', lineHeight: '1.3' }}>
            <div>Malang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div>Guru Mata Pelajaran</div>
            <div style={{ height: '45px' }} />
            <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>{user?.name || '................................'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
