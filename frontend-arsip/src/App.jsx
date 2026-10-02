import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SSOCallback from './pages/SSOCallback';
import DashboardGuru from './pages/DashboardGuru';
import DashboardAdmin from './pages/DashboardAdmin';
import KelolaMasterData from './pages/KelolaMasterData';
import KelolaAkun from './pages/KelolaAkun';
import UploadModal from './components/UploadModal';
import ReviewModal from './components/ReviewModal';
import { authService } from './services/api';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Role-based Protected Route wrapper
function RoleProtectedRoute({ children, allowedRoles, currentRole }) {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedRoles.includes(currentRole)) {
    return <Navigate to={currentRole === 'admin' ? '/admin' : '/guru'} replace />;
  }
  return children;
}

export default function App() {
  const [user, setUser] = useState(authService.getUser());
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editModulData, setEditModulData] = useState(null);
  const [selectedReviewDoc, setSelectedReviewDoc] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const rawRole = user?.role || 'guru';
  const role = (rawRole === 'admin' || rawRole === 'pengawas') ? 'admin' : 'guru';

  // Listen for storage changes (e.g. after login)
  useEffect(() => {
    const handleStorage = () => {
      setUser(authService.getUser());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleLoginSuccess = () => {
    setUser(authService.getUser());
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  const handleOpenReview = (doc) => {
    setSelectedReviewDoc(doc);
  };

  const handleOpenEdit = (doc) => {
    setEditModulData(doc);
    setIsUploadOpen(true);
  };

  const handleOpenNewUpload = () => {
    setEditModulData(null);
    setIsUploadOpen(true);
  };

  return (
    <Router>
      <Routes>
        {/* Login Route (public) */}
        <Route 
          path="/login" 
          element={
            authService.isLoggedIn() 
              ? <Navigate to={role === 'admin' ? '/admin' : '/guru'} replace /> 
              : <LoginPage onLoginSuccess={handleLoginSuccess} />
          } 
        />

        {/* Register Route (public) */}
        <Route 
          path="/register-storing" 
          element={
            authService.isLoggedIn() 
              ? <Navigate to={role === 'admin' ? '/admin' : '/guru'} replace /> 
              : <RegisterPage onLoginSuccess={handleLoginSuccess} />
          } 
        />

        {/* SSO Callback Route */}
        <Route path="/sso-callback" element={<SSOCallback />} />

        {/* Guru Route (protected) */}
        <Route 
          path="/guru" 
          element={
            <RoleProtectedRoute allowedRoles={['guru']} currentRole={role}>
              <Layout 
                role={role} 
                user={user}
                onUploadClick={handleOpenNewUpload}
                onLogout={handleLogout}
              >
                <DashboardGuru 
                  user={user}
                  onOpenUpload={handleOpenNewUpload} 
                  onOpenEdit={handleOpenEdit}
                  refreshTrigger={refreshTrigger}
                  onOpenReview={handleOpenReview}
                />
              </Layout>
            </RoleProtectedRoute>
          } 
        />
        
        {/* Admin Route (protected) */}
        <Route 
          path="/admin" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']} currentRole={role}>
              <Layout 
                role={role} 
                user={user}
                onUploadClick={handleOpenNewUpload}
                onLogout={handleLogout}
              >
                <DashboardAdmin 
                  refreshTrigger={refreshTrigger}
                  onOpenReview={handleOpenReview}
                  onOpenEdit={handleOpenEdit}
                  onOpenUpload={handleOpenNewUpload}
                />
              </Layout>
            </RoleProtectedRoute>
          } 
        />

        {/* Admin Master Data Route (Mapel & Jenis Perangkat) */}
        <Route 
          path="/admin/master-data" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']} currentRole={role}>
              <Layout 
                role={role} 
                user={user}
                onUploadClick={handleOpenNewUpload}
                onLogout={handleLogout}
              >
                <KelolaMasterData />
              </Layout>
            </RoleProtectedRoute>
          } 
        />

        <Route 
          path="/admin/kelola-master" 
          element={<Navigate to="/admin/master-data" replace />} 
        />

        {/* Admin Kelola Akun Route */}
        <Route 
          path="/admin/kelola-akun" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']} currentRole={role}>
              <Layout 
                role={role} 
                user={user}
                onUploadClick={handleOpenNewUpload}
                onLogout={handleLogout}
              >
                <KelolaAkun />
              </Layout>
            </RoleProtectedRoute>
          } 
        />

        {/* Fallback Redirection */}
        <Route 
          path="*" 
          element={
            authService.isLoggedIn()
              ? <Navigate to={role === 'admin' ? '/admin' : '/guru'} replace />
              : <Navigate to="/login" replace />
          } 
        />
      </Routes>

      {/* Upload & Edit Modal */}
      <UploadModal 
        isOpen={isUploadOpen} 
        editData={editModulData}
        onClose={() => {
          setIsUploadOpen(false);
          setEditModulData(null);
        }} 
        onUploadSuccess={triggerRefresh}
      />

      {/* PDF Review Modal (Admin/Supervisor & Guru View) */}
      <ReviewModal 
        isOpen={!!selectedReviewDoc} 
        document={selectedReviewDoc} 
        role={role}
        onClose={() => setSelectedReviewDoc(null)} 
        onReviewSuccess={triggerRefresh}
      />
    </Router>
  );
}
