import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  UserPlus,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  Layers,
  GraduationCap,
  KeyRound,
  CheckCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ManageStudentsModal({ isOpen, onClose, onStudentsUpdated }) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Form State for Adding Student Login
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    section: '',
    year: '3',
    department: 'Computer Science & Engineering',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitial();
    }
  }, [isOpen]);

  const loadInitial = async () => {
    try {
      setLoading(true);
      setError('');
      const [secRes, stuRes] = await Promise.all([
        api.getSections(),
        api.getStudents(),
      ]);

      const secList = secRes.sections || [];
      setSections(secList);
      setStudents(stuRes.students || []);

      if (secList.length > 0 && !formData.section) {
        setFormData((prev) => ({ ...prev, section: secList[0] }));
      }
    } catch (err) {
      setError(err.message || 'Failed to load student data.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await api.getStudents({
        section: selectedSectionFilter === 'ALL' ? undefined : selectedSectionFilter,
        search: searchTerm.trim() || undefined,
      });
      setStudents(res.students || []);
    } catch (err) {
      setError(err.message || 'Failed to refresh students list.');
    }
  };

  useEffect(() => {
    if (isOpen && !loading) {
      loadStudents();
    }
  }, [selectedSectionFilter, searchTerm]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'roll_number' ? value.toUpperCase() : value,
    }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.roll_number.trim() || !formData.name.trim() || !formData.password.trim()) {
      setError('Please provide Roll Number, Full Name, and Password.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      await api.createStudent({
        roll_number: formData.roll_number.trim().toUpperCase(),
        name: formData.name.trim(),
        section: formData.section || sections[0] || 'CSE-A',
        year: parseInt(formData.year) || 3,
        department: formData.department.trim(),
        password: formData.password.trim(),
      });

      setSuccess(`Student login for ${formData.name} (${formData.roll_number}) created successfully!`);
      setFormData({
        roll_number: '',
        name: '',
        section: sections[0] || 'CSE-A',
        year: '3',
        department: 'Computer Science & Engineering',
        password: '',
      });
      setActiveTab('list');
      await loadStudents();
      if (onStudentsUpdated) onStudentsUpdated();
    } catch (err) {
      setError(err.message || 'Failed to create student login.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (student) => {
    try {
      setDeletingId(student.id);
      setError('');
      setSuccess('');
      await api.deleteStudent(student.id);
      setSuccess(`Student ${student.name} (${student.roll_number}) deleted.`);
      setConfirmDelete(null);
      await loadStudents();
      if (onStudentsUpdated) onStudentsUpdated();
    } catch (err) {
      setError(err.message || 'Failed to delete student.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Student Accounts & Logins</h2>
              <p className="text-xs text-slate-400">Add student logins, view enrollments, and manage credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTab('list');
                setError('');
                setSuccess('');
              }}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                activeTab === 'list'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Enrolled Students ({students.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('add');
                setError('');
                setSuccess('');
              }}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                activeTab === 'add'
                  ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Student Login</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Notifications */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'add' ? (
            /* Add Student Form */
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  New Student Account Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      College Roll Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="roll_number"
                      placeholder="e.g. 22A91A0515"
                      value={formData.roll_number}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3.5 py-2 text-sm font-mono uppercase bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Full Student Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Class Section <span className="text-rose-500">*</span>
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {sections.map((sec) => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Year of Study
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Login Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="e.g. student123"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    The student can log in right away with this Roll Number and Password.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Creating Account...' : 'Create Student Login'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Student List View */
            <div className="space-y-3">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-semibold text-slate-500">Section:</span>
                  <select
                    value={selectedSectionFilter}
                    onChange={(e) => setSelectedSectionFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ALL">All Sections</option>
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Roster Table / List */}
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                  Loading student roster...
                </div>
              ) : students.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  No students found matching current filters.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-xs shrink-0">
                          {student.name.charAt(0)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{student.name}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {student.roll_number}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-medium text-slate-600">Sec: {student.section}</span>
                            <span>•</span>
                            <span>{student.year ? `Year ${student.year}` : 'Student'}</span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                              <CheckCircle className="w-3 h-3" />
                              <span>{student.completed_tasks_count || 0} completed</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setConfirmDelete(student)}
                        disabled={deletingId === student.id}
                        title={`Delete student ${student.name}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Box */}
        {confirmDelete && (
          <div className="p-4 bg-rose-50 border-t border-rose-200 shrink-0 animate-in slide-in-from-bottom-2 duration-150 flex items-center justify-between gap-4">
            <div className="text-xs text-rose-900">
              <span className="font-bold">Delete student login for {confirmDelete.name} ({confirmDelete.roll_number})?</span>
              <p className="text-[11px] text-rose-700 mt-0.5">
                This will remove their account and any completed submission logs.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStudent(confirmDelete)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs cursor-pointer"
              >
                Delete Student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
