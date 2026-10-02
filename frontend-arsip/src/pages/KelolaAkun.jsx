import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Trash2, ShieldAlert, RefreshCw, AlertCircle, Search, Edit2, Lock, X } from 'lucide-react';
import { userService } from '../services/api';

export default function KelolaAkun() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEditUser, setSelectedEditUser] = useState(null);
  const [editRole, setEditRole] = useState('guru_mapel');
  const [editStatus, setEditStatus] = useState('active');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data akun.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showToast = (type, text) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (id, name) => {
    setProcessingId(id);
    try {
      await userService.approveUser(id);
      showToast('success', `Akun ${name} berhasil disetujui!`);
      fetchUsers();
    } catch (err) {
      showToast('error', `Gagal menyetujui akun ${name}.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Yakin ingin menghapus akun ${name} secara permanen?`)) return;
    
    setProcessingId(id);
    try {
      await userService.deleteUser(id);
      showToast('success', `Akun ${name} berhasil dihapus.`);
      fetchUsers();
    } catch (err) {
      showToast('error', `Gagal menghapus akun ${name}.`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Yakin ingin mereset kata sandi untuk akun ${name} menjadi "password123"?`)) return;
    
    setProcessingId(id);
    try {
      await userService.resetPassword(id);
      showToast('success', `Sandi ${name} direset ke "password123".`);
    } catch (err) {
      showToast('error', `Gagal mereset sandi ${name}.`);
    } finally {
      setProcessingId(null);
    }
  };

  const openEditModal = (user) => {
    setSelectedEditUser(user);
    setEditRole(user.role);
    setEditStatus(user.status || 'pending');
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedEditUser) return;
    setProcessingId(selectedEditUser.id);
    try {
      await userService.updateRole(selectedEditUser.id, {
        role: editRole
      });
      if (editStatus !== selectedEditUser.status) {
        await userService.updateStatus(selectedEditUser.id, editStatus);
      }
      showToast('success', `Data akun berhasil diperbarui!`);
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      showToast('error', `Gagal menyimpan perubahan.`);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (u.name || '').toLowerCase().includes(q) || 
                        (u.email || '').toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border animate-in slide-in-from-top-2 fade-in duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
          )}
          <p className="text-sm font-bold tracking-wide pr-2">{toastMessage.text}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight sm:text-2xl">
            Manajemen Akun
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Kelola dan setujui pengguna aplikasi Arsip Perangkat Pembelajaran.
          </p>
        </div>
        <div>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border-l-4 border-amber-400 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Persetujuan</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{pendingCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border-l-4 border-emerald-400 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akun Aktif</p>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{activeCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-premium overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-150 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-700">Daftar Akun Guru</h2>
            <span className="text-xs text-slate-450">({filteredUsers.length} pengguna)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, email..."
                className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Persetujuan</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-slate-450 text-xs font-medium">Memuat data akun...</p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
              <p className="text-rose-600 text-sm font-bold">{error}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-slate-800 font-bold mb-1">Tidak ada data pengguna</h3>
              <p className="text-slate-500 text-xs">Pencarian tidak menemukan hasil apapun.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3.5 px-6 w-16">No</th>
                  <th className="py-3.5 px-6">Data Guru</th>
                  <th className="py-3.5 px-6">Role / Peran</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-center w-52">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredUsers.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                          {user.name ? user.name[0] : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 w-fit">
                          {user.role === 'guru_mapel' ? 'Guru Mapel' : user.role === 'admin' ? 'Admin' : user.role}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      {user.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Aktif
                        </span>
                      ) : user.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {user.status === 'pending' && (
                          <button
                            onClick={() => handleApprove(user.id, user.name)}
                            disabled={processingId === user.id}
                            title="Setujui Akun"
                            className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit Akun"
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleResetPassword(user.id, user.name)}
                          disabled={processingId === user.id}
                          title="Reset Password"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={processingId === user.id}
                            title="Hapus Akun"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Edit Akun Guru
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Role / Peran
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="guru_mapel">Guru Mata Pelajaran</option>
                  <option value="wali_kelas">Wali Kelas</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Status Akun
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                  <option value="pending">Menunggu Persetujuan</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={processingId !== null}
                className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {processingId !== null ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
