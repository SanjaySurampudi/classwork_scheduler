import React from 'react';
import { Calendar, CheckCircle2, LogOut, ShieldCheck, User, Sparkles, BookOpen } from 'lucide-react';

export default function Navbar({ user, onLogout }) {
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  ClassWork<span className="text-indigo-600">Scheduler</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Academic Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Track & manage class assignments seamlessly</p>
            </div>
          </div>

          {/* User profile & actions */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                  isAdmin ? 'bg-amber-600' : 'bg-indigo-600'
                }`}>
                  {isAdmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className="text-left text-xs leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate max-w-[130px] sm:max-w-[180px]">
                      {user.name}
                    </span>
                    {isAdmin ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wide">
                        Admin
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 uppercase tracking-wide">
                        {user.section || 'Student'}
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px] font-mono mt-0.5">
                    {isStudent ? (
                      <span>Roll: <strong className="text-slate-700">{user.roll_number}</strong></span>
                    ) : (
                      <span>Faculty In-charge</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Logout"
                  className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
