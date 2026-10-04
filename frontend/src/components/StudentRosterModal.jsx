import React, { useState, useEffect } from 'react';
import { X, Users, CheckCircle2, Clock, Search, Layers, UserX, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function StudentRosterModal({ isOpen, onClose, workId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('completed'); // 'completed' or 'pending'
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && workId) {
      loadRoster();
    }
  }, [isOpen, workId]);

  const loadRoster = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getClassworkCompletions(workId);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to fetch student completion data.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCompleted = (data?.completed_students || []).filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.student_roll_number.toLowerCase().includes(q) ||
      s.student_name.toLowerCase().includes(q) ||
      s.student_section.toLowerCase().includes(q)
    );
  });

  const filteredPending = (data?.pending_students || []).filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.roll_number.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.section.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Student Completion Roster</h2>
              <p className="text-xs text-slate-400">
                {data?.classwork ? (
                  <span>
                    {data.classwork.subject}: <strong>{data.classwork.title}</strong>
                  </span>
                ) : (
                  'Loading details...'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
              Loading student roster data...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : data ? (
            <>
              {/* Progress Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Completion Progress:</span>
                    <span className="text-sm font-extrabold text-indigo-600">
                      {data.total_completed} of {data.total_eligible} Students Completed
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                    {data.completion_percentage}% Done
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, data.completion_percentage)}%` }}
                  />
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    Target Section: <strong className="text-slate-700">{data.classwork.target_section}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Assigned by: <strong className="text-slate-700">{data.classwork.faculty_name}</strong>
                  </span>
                </div>
              </div>

              {/* Tabs & Search Filter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'completed'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Completed ({data.completed_students.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'pending'
                        ? 'bg-white text-rose-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Pending ({data.pending_students.length})
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search roll no, name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Table / List View */}
              {activeTab === 'completed' ? (
                filteredCompleted.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No completed submissions found.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Student Roll No</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Section</th>
                          <th className="py-3 px-4">Marked Completed At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredCompleted.map((s) => (
                          <tr key={s.completion_id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-indigo-700">
                              {s.student_roll_number}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {s.student_name}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                {s.student_section}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                <span>{new Date(s.completed_at).toLocaleString()}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                filteredPending.length === 0 ? (
                  <div className="py-10 text-center text-emerald-700 text-xs bg-emerald-50 rounded-xl border border-emerald-200 font-semibold">
                    🎉 Excellent! All enrolled students have completed this work!
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Student Roll No</th>
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Section</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPending.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-rose-700">
                              {s.roll_number}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-800">
                              {s.name}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                {s.section}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Close Roster
          </button>
        </div>
      </div>
    </div>
  );
}
