import React from 'react';
import { KeyRound, UserCheck, Shield } from 'lucide-react';

export default function QuickDemoBanner({ onQuickLogin, currentUser }) {
  const accounts = [
    { label: 'Aarav (CSE-A)', roll: '22A91A0501', role: 'student', section: 'CSE-A', pass: 'student123' },
    { label: 'Ananya (CSE-A)', roll: '22A91A0502', role: 'student', section: 'CSE-A', pass: 'student123' },
    { label: 'Admin / Faculty', roll: 'admin', role: 'admin', section: 'ALL', pass: 'admin123' },
  ];

  return (
    <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-100 px-4 py-2.5 shadow-inner border-b border-indigo-900/50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-300">
          <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>Quick Switch Test Accounts:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {accounts.map((acc) => {
            const isCurrent = currentUser && (
              (acc.role === 'admin' && currentUser.role === 'admin') ||
              (acc.role === 'student' && currentUser.roll_number === acc.roll)
            );

            return (
              <button
                key={acc.roll}
                onClick={() => onQuickLogin(acc)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white font-semibold ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-900 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-indigo-500/50'
                }`}
              >
                {acc.role === 'admin' ? (
                  <Shield className="w-3 h-3 text-amber-400" />
                ) : (
                  <UserCheck className="w-3 h-3 text-indigo-400" />
                )}
                <span>{acc.label}</span>
                <span className="text-[10px] text-slate-400 font-mono">({acc.roll})</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
