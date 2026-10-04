import React, { useState, useEffect } from 'react';
import { X, Calendar, Layers, Tag, User, BookOpen, AlertCircle, Sparkles, Link } from 'lucide-react';
import { api } from '../services/api';

export default function AdminTaskModal({ isOpen, onClose, onSave, editingWork }) {
  const [availableSections, setAvailableSections] = useState(['CSE-A']);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    faculty_name: '',
    description: '',
    target_section: 'CSE-A',
    category: 'Assignment',
    priority: 'Medium',
    due_date: '',
    resource_url: '',
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getSections().then((res) => {
      if (res.sections && res.sections.length > 0) {
        setAvailableSections(res.sections);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (editingWork) {
      setFormData({
        title: editingWork.title || '',
        subject: editingWork.subject || '',
        faculty_name: editingWork.faculty_name || '',
        description: editingWork.description || '',
        target_section: editingWork.target_section || 'CSE-A',
        category: editingWork.category || 'Assignment',
        priority: editingWork.priority || 'Medium',
        due_date: editingWork.due_date ? editingWork.due_date.slice(0, 16) : '',
        resource_url: editingWork.resource_url || '',
      });
    } else {
      // Default due date: 3 days from now at 17:00
      const d = new Date();
      d.setDate(d.getDate() + 3);
      d.setHours(17, 0, 0, 0);
      setFormData({
        title: '',
        subject: '',
        faculty_name: '',
        description: '',
        target_section: 'CSE-A',
        category: 'Assignment',
        priority: 'Medium',
        due_date: d.toISOString().slice(0, 16),
        resource_url: '',
      });
    }
    setError('');
  }, [editingWork, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.faculty_name || !formData.due_date) {
      setError('Please fill in all mandatory fields (Title, Subject, Faculty, and Due Date).');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save class work.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">
                {editingWork ? 'Edit Class Work' : 'Post New Class Work'}
              </h2>
              <p className="text-xs text-slate-400">
                Assign coursework or project tasks to specific student sections
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Subject Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                placeholder="e.g. Operating Systems, DBMS"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Faculty In-charge */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Faculty / Professor In-charge <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="faculty_name"
                placeholder="e.g. Dr. K. Srinivas"
                value={formData.faculty_name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Work Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Assignment / Work Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Banker's Algorithm Implementation & Simulation Report"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Target Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Section <span className="text-rose-500">*</span>
              </label>
              <select
                name="target_section"
                value={formData.target_section}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="ALL">All Sections (Department Wide)</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>{sec}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Assignment">Assignment</option>
                <option value="Lab Task">Lab Task</option>
                <option value="Project Work">Project Work</option>
                <option value="Homework">Homework</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent 🔥</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Due Date & Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Due Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Reference URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resource Link / URL <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="url"
                name="resource_url"
                placeholder="https://drive.google.com/... or docs"
                value={formData.resource_url}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instructions & Problem Description
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Detailed guidelines, questions to solve, submission format..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              {submitting ? 'Saving...' : editingWork ? 'Save Changes' : 'Post Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
