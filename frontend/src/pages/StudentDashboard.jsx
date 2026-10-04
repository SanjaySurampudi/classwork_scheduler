import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  ListTodo,
  AlertCircle,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  Award,
  BookOpen
} from 'lucide-react';
import { api } from '../services/api';
import TaskCard from '../components/TaskCard';

export default function StudentDashboard({ user }) {
  // Current viewing section (defaults to student's section e.g. 'CSE-A')
  const [selectedSection, setSelectedSection] = useState(user?.section || 'CSE-A');
  const [works, setWorks] = useState([]);
  const [stats, setStats] = useState({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    completion_rate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'completed'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [worksRes, statsRes] = await Promise.all([
        api.getClassworks({ section: selectedSection }),
        api.getStats(),
      ]);

      setWorks(worksRes.classworks || []);
      setStats(statsRes || {});
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      showToast(err.message || 'Failed to fetch assignments.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Mark Completed toggle
  const handleToggleComplete = async (workId) => {
    try {
      setTogglingId(workId);
      const res = await api.toggleComplete(workId);

      // Update state locally
      setWorks((prevWorks) =>
        prevWorks.map((w) => {
          if (w.id === workId) {
            const newCompleted = res.is_completed;
            const updatedTotal = newCompleted
              ? (w.total_completions || 0) + 1
              : Math.max(0, (w.total_completions || 0) - 1);

            return {
              ...w,
              is_completed: newCompleted,
              completed_at: res.completed_at,
              total_completions: updatedTotal,
            };
          }
          return w;
        })
      );

      // Re-fetch stats in background
      api.getStats().then((newStats) => setStats(newStats)).catch(() => {});

      if (res.is_completed) {
        showToast(`🎉 Marked work as completed! Registered under Roll No: ${user.roll_number}`);
      } else {
        showToast('Work reverted to pending status.');
      }
    } catch (err) {
      showToast(err.message || 'Failed to update completion status.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Filter works by tab and search
  const filteredWorks = works.filter((w) => {
    // Status filter
    if (filterStatus === 'pending' && w.is_completed) return false;
    if (filterStatus === 'completed' && !w.is_completed) return false;

    // Category filter
    if (categoryFilter !== 'ALL' && w.category !== categoryFilter) return false;

    // Search query
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
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/10">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Student Academic Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user?.name}!
            </h1>
            <p className="text-sm text-indigo-200 mt-1 max-w-xl">
              Logged in as Roll No <strong className="text-white font-mono">{user?.roll_number}</strong> • Section <strong className="text-white">{user?.section}</strong>. Review your faculty assignments and mark them complete as you finish.
            </p>
          </div>

          {/* Section Indicator or Switcher */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 min-w-[200px]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-200 mb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              <span>Assigned Class Section</span>
            </div>
            <div className="text-base font-extrabold text-white flex items-center gap-2">
              <span>{user?.section || 'CSE-A'}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                Active
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/80 mt-1">Showing all works for your class</p>
          </div>
        </div>

        {/* Subtle Decorative Elements */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tasks</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ListTodo className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.total_tasks || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Assigned to your section</p>
        </div>

        {/* Pending Works */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{stats.pending_tasks || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Requires your attention</p>
        </div>

        {/* Completed Works */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats.completed_tasks || 0}</div>
          <p className="text-xs text-slate-400 mt-1">Marked done by you</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Progress</span>
              <span className="text-xs font-extrabold text-indigo-600">
                {stats.completion_rate || 0}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.completion_rate || 0}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">Overall completion rate</p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Works ({works.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-white text-amber-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({works.filter((w) => !w.is_completed).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-white text-emerald-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({works.filter((w) => w.is_completed).length})
          </button>
        </div>

        {/* Search & Category */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Assignment">Assignments</option>
            <option value="Lab Task">Lab Tasks</option>
            <option value="Project Work">Projects</option>
            <option value="Homework">Homework</option>
          </select>

          <button
            onClick={loadData}
            title="Refresh List"
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
          <p className="text-sm">Fetching class works for Section {selectedSection}...</p>
        </div>
      ) : filteredWorks.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 border-dashed">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No class works matching this filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterStatus === 'pending'
              ? 'Awesome! You have cleared all pending class works for this section.'
              : 'There are currently no assignments or tasks matching the selected filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorks.map((work) => (
            <TaskCard
              key={work.id}
              work={work}
              user={user}
              onToggleComplete={handleToggleComplete}
              isToggling={togglingId === work.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
