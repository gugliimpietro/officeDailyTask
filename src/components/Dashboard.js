import React, { useState, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { useAppState } from "../context/AppStateContext";
import {
  Search,
  Plus,
  CheckSquare,
  Clock,
  XCircle,
  Filter
} from "lucide-react"; // Removed AlertCircle
import TaskItem from "./TaskItem";
import { CreateTaskModal, RejectTaskModal } from "./Modals";

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, tasks, addTask, acceptTask, rejectTask } = useAppState();
  const { triggerToast } = useOutletContext() || { triggerToast: () => {} };

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectModalTaskId, setRejectModalTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); 

  // --- Filtering Logic ---
  const filteredTasks = useMemo(() => {
    if (!user) return []; 

    let result = tasks;

    // 1. Role Filter
    if (user.role !== "ADMIN") {
      result = result.filter(t => t.teamId === user.teamId);
    }

    // 2. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.jobType && t.jobType.toLowerCase().includes(q))
      );
    }

    // 3. Quick Filters
    if (filterType === "urgent") {
      result = result.filter(t => t.priority === "High");
    }

    return result;
  }, [tasks, user, searchQuery, filterType]);

  const stats = useMemo(() => ({
    new: filteredTasks.filter(t => t.status === "New"),
    active: filteredTasks.filter(t => t.status === "Running"),
    completed: filteredTasks.filter(t => t.status === "Done"),
    rejected: filteredTasks.filter(t => t.status === "Rejected"),
    urgent: filteredTasks.filter(t => t.priority === "High")
  }), [filteredTasks]);

  const handleTaskClick = (taskId) => {
    navigate(`/task/${taskId}`);
  };

  const handleCreateTask = (payload) => {
    addTask(payload);
    setShowCreateModal(false);
    triggerToast("Pekerjaan baru berhasil dibuat", "success");
  };

  const handleRejectConfirm = (taskId, reason) => {
    rejectTask(taskId, reason);
    setRejectModalTaskId(null);
    triggerToast("Pekerjaan telah ditolak", "warning");
  };

  if (!user) return null; 

  return (
    <div className="space-y-8 pb-12">
      {/* --- Header Section --- */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Dasbor Pekerjaan
          </h1>
          <p className="text-slate-500 mt-2">
            Halo, <span className="font-semibold text-blue-600">{user.name}</span>. 
            Anda memiliki {stats.active.length} pekerjaan aktif hari ini.
          </p>
        </div>

        {user.role === "TEAM_LEADER" && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>Buat Pekerjaan Baru</span>
          </button>
        )}
      </div>

      {/* --- Search & Filter Bar --- */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor referensi, judul, atau jenis..."
            className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-slate-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setFilterType("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            Semua
          </button>
          <button 
             onClick={() => setFilterType("urgent")}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filterType === 'urgent' ? 'bg-red-50 text-red-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Filter className="w-3 h-3" /> Urgent
          </button>
        </div>
      </div>

      {/* --- Stats Grid --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard label="Semua" value={filteredTasks.length} icon={CheckSquare} color="text-slate-600" bg="bg-slate-100" />
        <StatCard label="Baru" value={stats.new.length} icon={Plus} color="text-blue-600" bg="bg-blue-50" />
        <StatCard label="Proses" value={stats.active.length} icon={Clock} color="text-orange-600" bg="bg-orange-50" />
        <StatCard label="Selesai" value={stats.completed.length} icon={CheckSquare} color="text-green-600" bg="bg-green-50" />
        <StatCard label="Ditolak" value={stats.rejected.length} icon={XCircle} color="text-red-600" bg="bg-red-50" />
      </div>

      {/* --- Main Content Grid --- */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Actionable Tasks (New & Active) */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Tasks Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Butuh Tindakan (Baru)
              </h3>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">{stats.new.length}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {stats.new.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Tidak ada pekerjaan baru.</div>
              ) : (
                stats.new.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    user={user}
                    onTaskClick={() => handleTaskClick(task.id)}
                    onAcceptTask={acceptTask}
                    setRejectModalTaskId={setRejectModalTaskId}
                  />
                ))
              )}
            </div>
          </div>

          {/* Active Tasks Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-orange-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Sedang Dikerjakan
              </h3>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">{stats.active.length}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {stats.active.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">Tidak ada pekerjaan aktif.</div>
              ) : (
                stats.active.map(task => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    user={user}
                    onTaskClick={() => handleTaskClick(task.id)}
                    onAcceptTask={null} 
                    setRejectModalTaskId={null}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Historical (Done/Rejected) */}
        <div className="space-y-6">
           <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
               <h3 className="font-bold text-slate-700 text-sm uppercase">Riwayat Selesai</h3>
             </div>
             <div className="divide-y divide-slate-200/50">
                {stats.completed.slice(0, 5).map(task => (
                   <TaskItem key={task.id} task={task} user={user} onTaskClick={() => handleTaskClick(task.id)} compact />
                ))}
                {stats.completed.length === 0 && <div className="p-6 text-center text-xs text-slate-400">Belum ada data.</div>}
             </div>
           </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateTaskModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateTask}
          currentTaskCount={tasks.length}
        />
      )}

      {rejectModalTaskId && (
        <RejectTaskModal
          taskId={rejectModalTaskId}
          onClose={() => setRejectModalTaskId(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}