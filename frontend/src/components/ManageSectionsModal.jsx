import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Trash2, AlertCircle, CheckCircle2, Users, ClipboardList } from 'lucide-react';
import { api } from '../services/api';

export default function ManageSectionsModal({ isOpen, onClose, onSectionsUpdated }) {
  const [sectionsDetail, setSectionsDetail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSectionName, setNewSectionName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingName, setDeletingName] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null); // { name, studentCount, workCount }

  useEffect(() => {
    if (isOpen) {
      loadSections();
    }
  }, [isOpen]);

  const loadSections = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getSections();
      if (res.sections_detail) {
        setSectionsDetail(res.sections_detail);
      } else {
        // Fallback if sections_detail not present
        const list = (res.sections || []).map((name) => ({
          name,
          student_count: 0,
          work_count: 0,
        }));
        setSectionsDetail(list);
      }
    } catch (err) {
      setError(err.message || 'Failed to load sections.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    const clean = newSectionName.trim().toUpperCase();
    if (!clean) {
      setError('Please enter a section name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      await api.createSection(clean);
      setSuccess(`Section "${clean}" added successfully!`);
      setNewSectionName('');
      await loadSections();
      if (onSectionsUpdated) onSectionsUpdated();
    } catch (err) {
      setError(err.message || 'Failed to add section.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (sec) => {
    setError('');
    setSuccess('');
    setConfirmDelete({
      name: sec.name,
      studentCount: sec.student_count || 0,
      workCount: sec.work_count || 0,
    });
  };

  const executeDelete = async (force = false) => {
    if (!confirmDelete) return;
    const name = confirmDelete.name;

    try {
      setDeletingName(name);
      setError('');
      setSuccess('');
      await api.deleteSection(name, force);
      setSuccess(`Section "${name}" deleted successfully.`);
      setConfirmDelete(null);
      await loadSections();
      if (onSectionsUpdated) onSectionsUpdated();
    } catch (err) {
      setError(err.message || 'Failed to delete section.');
    } finally {
      setDeletingName(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Class Sections Management</h2>
              <p className="text-xs text-slate-400">Add new academic sections or remove existing ones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Status feedback */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Add Section Form */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Add New Class Section
            </h3>
            <form onSubmit={handleAddSection} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. CSE-B, AIML-A, ECE-B"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2 text-sm font-mono uppercase bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={submitting || !newSectionName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{submitting ? 'Adding...' : 'Add Section'}</span>
              </button>
            </form>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Sections are instantly available in class assignment targeting and student registration.
            </p>
          </div>

          {/* Active Sections List */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Active Sections ({sectionsDetail.length})
              </h3>
              <span className="text-[11px] text-slate-400">At least 1 active section required</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <div className="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2" />
                Loading sections...
              </div>
            ) : sectionsDetail.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                No sections found. Add one above.
              </div>
            ) : (
              <div className="space-y-2">
                {sectionsDetail.map((sec) => (
                  <div
                    key={sec.name}
                    className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold font-mono text-sm">
                        {sec.name}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sec.student_count || 0} students</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sec.work_count || 0} works</span>
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteClick(sec)}
                      disabled={deletingName === sec.name || sectionsDetail.length <= 1}
                      title={sectionsDetail.length <= 1 ? 'Cannot delete the only section' : `Delete section ${sec.name}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {confirmDelete && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 shrink-0 animate-in slide-in-from-bottom-2 duration-150">
            <div className="text-xs text-amber-900 font-medium space-y-1 mb-3">
              <p className="font-bold text-amber-950">
                Are you sure you want to delete section "{confirmDelete.name}"?
              </p>
              {confirmDelete.studentCount > 0 || confirmDelete.workCount > 0 ? (
                <p className="text-rose-700 font-semibold">
                  ⚠️ Notice: There are {confirmDelete.studentCount} student(s) and {confirmDelete.workCount} classwork(s) currently assigned to this section. Deleting will remove this section from active rosters.
                </p>
              ) : (
                <p className="text-slate-600">
                  This section has 0 students and 0 classworks and can be safely deleted.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeDelete(confirmDelete.studentCount > 0 || confirmDelete.workCount > 0)}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
