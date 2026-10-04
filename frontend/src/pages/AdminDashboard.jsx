import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Users,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  ClipboardList,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import TaskCard from '../components/TaskCard';
import AdminTaskModal from '../components/AdminTaskModal';
import StudentRosterModal from '../components/StudentRosterModal';

export default function AdminDashboard({ user }) {
  const [works, setWorks] = useState([]);
  const [stats, setStats] = useState({
    total_works: 0,
    total_students: 0,
    total_completions: 0,
    active_sections: [],
  });
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState(['CSE-A']);
  const [selectedSection, setSelectedSection] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState(null);
  const [rosterWorkId, setRosterWorkId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    api.getSections().then((res) => {
      if (res.sections && res.sections.length > 0) {
        setSections(res.sections);
      }
    }).catch(() => {});
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [worksRes, statsRes] = await Promise.all([
        api.getClassworks({ section: selectedSection === 'ALL' ? undefined : selectedSection }),
        api.getStats(),
      ]);
      setWorks(worksRes.classworks || []);
      setStats(statsRes || {});
    } catch (err) {
      console.error('Failed to load admin data:', err);
      showToast(err.message || 'Failed to fetch admin data.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingWork(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (work) => {
    setEditingWork(work);
    setIsModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveWork = async (formData) => {
    if (editingWork) {
      const res = await api.updateClasswork(editingWork.id, formData);
      showToast('Class work updated successfully!');
      loadData();
    } else {
      const res = await api.createClasswork(formData);
      showToast('New class work posted to section!');
      loadData();
    }
  };

  // Handle Delete
  const handleDeleteWork = async (workId) => {
    if (!window.confirm('Are you sure you want to delete this class work? All recorded student completions for this work will also be deleted.')) {
      return;
    }

    try {
      await api.deleteClasswork(workId);
      showToast('Class work deleted successfully.');
      setWorks((prev) => prev.filter((w) => w.id !== workId));
      api.getStats().then(setStats).catch(() => {});
    } catch (err) {
      showToast(err.message || 'Failed to delete class work.', 'error');
    }
  };

  // Open Completion Roster Modal
  const handleViewCompletions = (work) => {
    setRosterWorkId(work.id);
  };

  const filteredWorks = works.filter((w) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = w.title.toLowerCase().includes(q);
      const matchSubject = w.subject.toLowerCase().includes(q);
      const matchFaculty = w.faculty_name.toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchFaculty) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs sm:text-sm font-semibold border ${
              toastMessage.type === 'error'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Admin Hero Banner */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold backdrop-blur-xs mb-3 border border-amber-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Faculty & Academic Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Class Work Management Portal
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Post course works, set due dates, assign to specific class sections, and track individual student completions by roll number in real-time.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          <span>Post New Class Work</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Works Posted
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.total_works || 0}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Across all curriculum sections</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats.total_students || 0}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Active student roll numbers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recorded Submissions
            </span>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">
              {stats.total_completions || 0}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Total completed task logs</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Section Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Section:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl flex-wrap">
            {['ALL', ...sections].map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSection === sec
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sec === 'ALL' ? 'All Sections' : sec}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search works by title or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={loadData}
            title="Refresh Works"
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Task Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Fetching assignments...</p>
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Class Works Posted Yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
            Click "Post New Class Work" to assign assignments, lab tasks, or projects to class sections.
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Post First Class Work
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.map((work) => (
            <TaskCard
              key={work.id}
              work={work}
              user={user}
              onViewCompletions={handleViewCompletions}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteWork}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <AdminTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveWork}
        editingWork={editingWork}
      />

      {/* Student Roster Modal */}
      <StudentRosterModal
        isOpen={Boolean(rosterWorkId)}
        onClose={() => setRosterWorkId(null)}
        workId={rosterWorkId}
      />
    </div>
  );
}
