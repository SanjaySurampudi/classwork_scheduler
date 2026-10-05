import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, ArrowLeft, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import { api, authStorage } from '../services/api';

export default function RegisterPage({ onRegisterSuccess, onNavigateLogin }) {
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({
    roll_number: '',
    name: '',
    section: '',
    year: '3',
    department: 'Computer Science & Engineering',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSections()
      .then((res) => {
        if (res.sections && res.sections.length > 0) {
          setSections(res.sections);
          setFormData((prev) => ({
            ...prev,
            section: res.default_section || res.sections[0],
          }));
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'roll_number' ? value.toUpperCase() : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.roll_number.trim() || !formData.name.trim() || !formData.password) {
      setError('Please provide Roll Number, Full Name, and Password.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api.studentRegister({
        roll_number: formData.roll_number.trim().toUpperCase(),
        name: formData.name.trim(),
        section: formData.section,
        year: parseInt(formData.year),
        department: formData.department,
        password: formData.password,
      });

      authStorage.setToken(res.token);
      authStorage.setUser(res.user);
      onRegisterSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-lg w-full">
        {/* Back Link */}
        <button
          onClick={onNavigateLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </button>

        {/* Card Box */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Student Registration</h1>
                <p className="text-xs text-slate-400">Join Section {formData.section} to track assignments and deadlines</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Roll Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  College Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="roll_number"
                  placeholder="e.g. 22A91A0510"
                  value={formData.roll_number}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 text-sm font-mono uppercase rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Priya Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Class Section <span className="text-rose-500">*</span>
                </label>
                {sections.length === 1 ? (
                  <div className="flex items-center gap-2 px-3.5 py-2 text-sm font-bold rounded-xl border border-indigo-200 bg-indigo-50/60 text-indigo-900">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>{sections[0]}</span>
                    <span className="text-[11px] font-normal text-indigo-600">(Current Active Section)</span>
                  </div>
                ) : (
                  <select
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {sections.map((sec) => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Year of Study
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-500/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Complete Registration & Sign In'}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-bold text-indigo-600 hover:underline cursor-pointer"
                >
                  Log in here
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
