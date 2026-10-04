import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  Circle,
  ExternalLink,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Tag,
  Layers,
  Sparkles,
  Flame
} from 'lucide-react';

export default function TaskCard({
  work,
  user,
  onToggleComplete,
  onViewCompletions,
  onEdit,
  onDelete,
  isToggling = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  // Compute deadline formatting & urgency
  const dueDate = new Date(work.due_date);
  const now = new Date();
  const diffHours = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffHours / 24);

  let urgencyBadge = {
    label: `Due in ${diffDays} days`,
    color: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  if (diffHours < 0) {
    urgencyBadge = {
      label: 'Deadline Passed',
      color: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold',
    };
  } else if (diffHours <= 24) {
    urgencyBadge = {
      label: 'Due Today / Soon',
      color: 'bg-amber-100 text-amber-800 border-amber-200 font-semibold animate-pulse',
    };
  } else if (diffDays === 1) {
    urgencyBadge = {
      label: 'Due Tomorrow',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    };
  }

  // Priority color config
  const priorityConfig = {
    Urgent: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
    High: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
    Medium: 'bg-sky-50 text-sky-700 border-sky-200',
    Normal: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  // Category badge config
  const categoryConfig = {
    'Assignment': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Lab Task': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Project Work': 'bg-purple-50 text-purple-700 border-purple-200',
    'Homework': 'bg-amber-50 text-amber-700 border-amber-200',
    'Seminar': 'bg-teal-50 text-teal-700 border-teal-200',
  };

  const formattedDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
        work.is_completed
          ? 'border-emerald-200/90 shadow-xs bg-emerald-50/20'
          : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      {/* Top Banner Accent */}
      <div
        className={`h-1.5 w-full rounded-t-2xl ${
          work.is_completed
            ? 'bg-emerald-500'
            : work.priority === 'Urgent'
            ? 'bg-rose-500'
            : work.priority === 'High'
            ? 'bg-orange-500'
            : 'bg-indigo-500'
        }`}
      />

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Header Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Target Section */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
                <Layers className="w-3 h-3 text-indigo-400" />
                {work.target_section === 'ALL' ? 'All Sections' : `Sec: ${work.target_section}`}
              </span>

              {/* Category */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${
                  categoryConfig[work.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {work.category || 'Assignment'}
              </span>

              {/* Priority */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border ${
                  priorityConfig[work.priority] || priorityConfig.Medium
                }`}
              >
                {work.priority === 'Urgent' && <Flame className="w-3 h-3 text-rose-500" />}
                {work.priority}
              </span>
            </div>

            {/* Urgency Badge */}
            <span
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${urgencyBadge.color}`}
            >
              <Clock className="w-3.5 h-3.5" />
              {urgencyBadge.label}
            </span>
          </div>

          {/* Subject Title */}
          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {work.subject}
          </div>

          {/* Task Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
            {work.title}
          </h3>

          {/* Faculty In-charge */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2 mb-3">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Assigned by:</span>
            <span className="font-semibold text-slate-700">{work.faculty_name}</span>
          </div>

          {/* Description */}
          {work.description && (
            <div className="text-sm text-slate-600 bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 mb-4">
              <p className={isExpanded ? '' : 'line-clamp-2'}>{work.description}</p>
              {work.description.length > 110 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                >
                  {isExpanded ? (
                    <>
                      Show less <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      Read full instructions <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Reference Link if available */}
          {work.resource_url && (
            <a
              href={work.resource_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline mb-4 bg-indigo-50/60 px-2.5 py-1 rounded-md border border-indigo-100"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Reference Material / Portal Link
            </a>
          )}
        </div>

        {/* Bottom Section */}
        <div className="pt-3 border-t border-slate-100 mt-2 flex flex-col gap-3">
          {/* Due date timestamp display */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Due: <strong>{formattedDate}</strong></span>
            </div>

            {/* Total submissions counter */}
            {work.total_completions !== undefined && (
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-500" />
                {work.total_completions} {work.total_completions === 1 ? 'submission' : 'submissions'}
              </span>
            )}
          </div>

          {/* Actions for Students */}
          {isStudent && (
            <div className="pt-1">
              {work.is_completed ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span>Marked Completed!</span>
                      {work.completed_at && (
                        <div className="text-[10px] text-emerald-600 font-normal">
                          {new Date(work.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(work.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    disabled={isToggling}
                    onClick={() => onToggleComplete(work.id)}
                    className="text-xs text-slate-500 hover:text-rose-600 hover:underline px-2 py-1 rounded transition-colors disabled:opacity-50"
                    title="Undo completion status"
                  >
                    Undo / Mark Pending
                  </button>
                </div>
              ) : (
                <button
                  disabled={isToggling}
                  onClick={() => onToggleComplete(work.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-sm hover:shadow-indigo-500/25 transition-all duration-150 disabled:opacity-60 cursor-pointer"
                >
                  <Circle className="w-4 h-4" />
                  <span>{isToggling ? 'Updating...' : 'Mark Completed'}</span>
                </button>
              )}
            </div>
          )}

          {/* Actions for Admin */}
          {isAdmin && (
            <div className="pt-1 flex items-center justify-between gap-2">
              <button
                onClick={() => onViewCompletions(work)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>View Student Roster ({work.total_completions || 0})</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(work)}
                  title="Edit Assignment"
                  className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(work.id)}
                  title="Delete Assignment"
                  className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
