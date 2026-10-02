import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLock, FaUserPlus, FaEye, FaEyeSlash, FaUser } from 'react-icons/fa';
import './Login.css';
import { authService } from '../services/api';

const RegisterPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Mohon isi nama, email dan password.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const data = await authService.register(name, email, password);
      setIsSuccess(true);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Gagal mendaftar. Pastikan email belum digunakan.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-wrapper">
          <img src="/IMG_03611.png" alt="Logo SMK NU Donomulyo" className="overlapping-logo" />
        </div>
        <div className="login-header">
          <h2>Arsip Perangkat Pembelajaran</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Pendaftaran Akun Guru Baru</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ color: '#10b981', fontSize: '48px', marginBottom: '16px' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 style={{ color: '#1f2937', marginBottom: '12px' }}>Pendaftaran Berhasil!</h3>
            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: '1.6' }}>
              Akun Anda telah berhasil dibuat. Silakan tunggu persetujuan dari Admin sebelum Anda dapat login.
            </p>
            <Link 
              to="/login" 
              className="btn-login" 
              style={{ backgroundColor: '#4f46e5', textDecoration: 'none', display: 'inline-block', width: '100%' }}
            >
              Kembali ke Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="input-group">
              <label htmlFor="name">Nama Lengkap</label>
              <div className="input-icon-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  id="name"
                  placeholder="Masukkan nama lengkap anda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <div className="input-icon-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  id="email"
                  placeholder="Masukkan email anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-icon-wrapper" style={{ position: 'relative' }}>
                <FaLock className="input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Buat password (min. 6 karakter)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: '40px' }}
                />
                <span 
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    cursor: 'pointer',
                    color: '#94a3b8' 
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-login"
              style={{ backgroundColor: '#4f46e5' }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <FaUserPlus className="btn-icon" /> Daftar Akun
                </>
              )}
            </button>
          </form>
        )}

        {!isSuccess && (
          <div className="login-link" style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
            Sudah punya akun? <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 'bold' }}>Login di sini</Link>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', lineHeight: '1.5', marginTop: '24px' }}>
          <strong>SMK NU DONOMULYO MALANG © 2026</strong>
          <div>Malang, Indonesia</div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
