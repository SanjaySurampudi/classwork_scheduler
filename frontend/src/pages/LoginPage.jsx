import React, { useState } from 'react';
import { Calendar, User, ShieldCheck, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { api, authStorage } from '../services/api';

export default function LoginPage({ onLoginSuccess, onNavigateRegister }) {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'admin'
  const [rollNumber, setRollNumber] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!rollNumber.trim() || !password) {
      setError('Please provide both College Roll Number and Password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.studentLogin(rollNumber, password);
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!adminUsername.trim() || !password) {
      setError('Please provide Admin Username and Password.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.adminLogin(adminUsername, password);
      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Admin login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click quick fill helpers
  const fillSample = (role, id, pass) => {
    setError('');
    if (role === 'student') {
      setActiveTab('student');
      setRollNumber(id);
      setPassword(pass);
    } else {
      setActiveTab('admin');
      setAdminUsername(id);
      setPassword(pass);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-md w-full">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            ClassWork Scheduler
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access assigned academic tasks, due dates, and track your completions
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/80 border-b border-slate-200/80 m-3 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'student'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('admin');
                setError('');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-amber-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Faculty / Admin</span>
            </button>
          </div>

          <div className="p-6 pt-4">
            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {activeTab === 'student' ? (
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    College Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 22A91A0501"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value.toUpperCase())}
                    required
                    className="w-full px-4 py-2.5 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter your college-issued roll number (e.g., 22A91A0501)
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-500/25 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In as Student'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500">
                    Not registered yet?{' '}
                    <button
                      type="button"
                      onClick={onNavigateRegister}
                      className="font-bold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Register with Roll Number
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admin / Faculty Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. admin"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Admin Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md shadow-amber-500/25 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : 'Enter Faculty Portal'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Quick Autofill Helper inside Card */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-xs">
              <span className="font-semibold text-slate-500 block mb-2">Try Demo Accounts:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fillSample('student', '22A91A0501', 'student123')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 text-left transition-colors"
                >
                  <strong className="block text-indigo-600 font-mono text-[11px]">22A91A0501</strong>
                  <span className="text-[10px] text-slate-500">Aarav (CSE-A)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillSample('student', '22A91A0503', 'student123')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 text-left transition-colors"
                >
                  <strong className="block text-indigo-600 font-mono text-[11px]">22A91A0503</strong>
                  <span className="text-[10px] text-slate-500">Rohan (CSE-B)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillSample('student', '22A91A0505', 'student123')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 rounded-lg text-slate-700 text-left transition-colors"
                >
                  <strong className="block text-indigo-600 font-mono text-[11px]">22A91A0505</strong>
                  <span className="text-[10px] text-slate-500">Vikram (ECE-A)</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillSample('admin', 'admin', 'admin123')}
                  className="px-2.5 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-lg text-slate-700 text-left transition-colors"
                >
                  <strong className="block text-amber-700 font-mono text-[11px]">admin</strong>
                  <span className="text-[10px] text-slate-500">Faculty Admin</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
