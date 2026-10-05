import React, { useState, useEffect } from 'react';
import { api, authStorage } from './services/api';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(authStorage.getUser());
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'register'
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Validate token and profile on load
  useEffect(() => {
    const verifySession = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setLoadingInitial(false);
        return;
      }

      try {
        const res = await api.getProfile();
        setCurrentUser(res.user);
        authStorage.setUser(res.user);
      } catch (err) {
        console.warn('Session expired or invalid, clearing local session.');
        authStorage.clear();
        setCurrentUser(null);
      } finally {
        setLoadingInitial(false);
      }
    };

    verifySession();
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    authStorage.setUser(user);
  };

  const handleLogout = () => {
    authStorage.clear();
    setCurrentUser(null);
    setCurrentView('login');
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Main Navbar */}
      <Navbar user={currentUser} onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1">
        {!currentUser ? (
          currentView === 'login' ? (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigateRegister={() => setCurrentView('register')}
            />
          ) : (
            <RegisterPage
              onRegisterSuccess={handleLoginSuccess}
              onNavigateLogin={() => setCurrentView('login')}
            />
          )
        ) : currentUser.role === 'admin' ? (
          <AdminDashboard user={currentUser} />
        ) : (
          <StudentDashboard user={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © {new Date().getFullYear()} <strong>ClassWork Scheduler</strong>. College Academic Course Management System.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Roll Number Authentication</span>
            <span>•</span>
            <span>Section Work Allocation</span>
            <span>•</span>
            <span>Real-time Mark Completed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
