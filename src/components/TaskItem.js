import React from 'react';
import { User, Clock, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { INITIAL_USERS } from '../data/mockData';
import { formatDateTime } from '../utils/helpers';

export default function TaskItem({ task, user, onTaskClick, onAcceptTask, setRejectModalTaskId }) {
  const assignee = INITIAL_USERS.find(u => u.id === task.assigneeId);
  const isMemberPendingAction = user.role === 'TEAM_MEMBER' && task.status === 'New' && task.assigneeId === user.id;
  const handleOpenTask = () => {
    if (!onTaskClick) return;
    const identifier = typeof task.id !== 'undefined' ? task.id : task;
    onTaskClick(identifier, task);
  };

  return (
    <div onClick={handleOpenTask} className="p-4 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0 group bg-white relative">
      <div className="flex justify-between items-start">
        <div className="w-full pr-8">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{task.code}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                task.priority === 'High'
                  ? 'bg-red-50 text-red-600 border-red-100'
                  : task.priority === 'Normal'
                  ? 'bg-orange-50 text-orange-600 border-orange-100'
                  : 'bg-green-50 text-green-600 border-green-100'
              }`}>{task.priority}</span>
            {task.status === 'Rejected' && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-red-800 text-white">DITOLAK</span>}
            {task.reopenRequested && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-orange-100 text-orange-700 animate-pulse">Request Reopen</span>}
            <span className="flex items-center gap-1 text-[10px] font-medium text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded-full border border-slate-100">
               <User className="w-3 h-3 text-slate-400" /> {assignee ? assignee.name : 'Unassigned'}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400 ml-auto sm:ml-0"><Clock className="w-3 h-3" /> {formatDateTime(task.createdAt)}</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 line-clamp-2 leading-snug">{task.title}</h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">{task.jobType || task.description}</p>
          
          {isMemberPendingAction && (
            <div className="mt-3 flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); onAcceptTask(task.id); }} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                <CheckCircle className="w-3 h-3" /> Terima
              </button>
              <button onClick={(e) => { e.stopPropagation(); setRejectModalTaskId(task.id); }} className="flex items-center gap-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-1.5 rounded-lg">
                <XCircle className="w-3 h-3" /> Tolak
              </button>
            </div>
          )}
        </div>
        {!isMemberPendingAction && <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 mt-1 shrink-0 absolute right-4 top-4" />}
      </div>
    </div>
  );
}
