import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, FileText, UploadCloud, Users, Layers, UserCheck } from 'lucide-react';

export default function Sidebar({ role, user, onUploadClick }) {
  const location = useLocation();
  const isGuru = role !== 'admin' && role !== 'pengawas';
  
  const menuItems = isGuru 
    ? [
        { 
          name: 'Dashboard Guru', 
          path: '/guru', 
          icon: LayoutDashboard,
          isActive: location.pathname === '/guru' && !location.search.includes('tab=list')
        },
        { 
          name: 'Perangkat Saya', 
          path: '/guru?tab=list', 
          icon: FileText,
          isActive: location.pathname === '/guru' && location.search.includes('tab=list')
        },
      ]
    : [
        { 
          name: 'Dashboard Admin', 
          path: '/admin', 
          icon: LayoutDashboard,
          isActive: location.pathname === '/admin' && !location.search.includes('tab=master')
        },
        { 
          name: 'Data Master', 
          path: '/admin?tab=master', 
          icon: Users,
          isActive: location.pathname === '/admin' && location.search.includes('tab=master')
        },
        { 
          name: 'Kelola Mapel & Jenis', 
          path: '/admin/master-data', 
          icon: Layers,
          isActive: location.pathname.startsWith('/admin/master-data') || location.pathname.startsWith('/admin/kelola-master')
        },
        { 
          name: 'Manajemen Akun', 
          path: '/admin/kelola-akun', 
          icon: UserCheck,
          isActive: location.pathname.startsWith('/admin/kelola-akun')
        },
      ];

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-350 flex flex-col h-screen fixed left-0 top-0 z-30 border-r border-slate-800">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 shrink-0">
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md shadow-indigo-500/25 transition-transform duration-200 hover:scale-105">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight tracking-wide">Arsip Perangkat</h1>
          <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">SMK NU Donomulyo</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Menu Utama
        </div>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const active = item.isActive;
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative cursor-pointer ${
                active
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 translate-x-0.5'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:translate-x-1'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'
              }`} />
              <span>{item.name}</span>
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </Link>
          );
        })}

        {isGuru && (
          <div className="pt-4">
            <button
              onClick={onUploadClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
            >
              <UploadCloud className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" />
              <span>Unggah Dokumen</span>
            </button>
          </div>
        )}
      </nav>

      {/* Footer Info - Dynamic User */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 shrink-0">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-indigo-400">
            {getInitials(user?.name)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">
              {role === 'admin' ? 'Admin / Pengawas' : 'Guru'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
