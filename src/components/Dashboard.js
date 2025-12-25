import React, { useState } from "react";
import {
  Search,
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import TaskItem from "./TaskItem";
import { CreateTaskModal, RejectTaskModal } from "./Modals";

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white/90 p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-3">
      <div className={`p-3 rounded-2xl bg-slate-50 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide line-clamp-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

/**
 * Props expected:
 * - user
 * - tasks
 * - onTaskClick(task)
 * - onAddTask(newTaskData)
 * - onAcceptTask(taskId)
 * - onRejectTask(taskId, reason)
 */
export default function Dashboard({
  user,
  tasks = [],
  onTaskClick,
  onAddTask,
  onAcceptTask,
  onRejectTask,
}) {
  console.log("DASHBOARD LOADED ✅", { user });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [rejectModalTaskId, setRejectModalTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Role-based visibility
  let filteredTasks = tasks.filter((task) => {
    if (user.role === "ADMIN") return true;
    if (user.role === "TEAM_LEADER") return task.teamId === user.teamId;
    if (user.role === "TEAM_MEMBER") return task.teamId === user.teamId;
    return false;
  });

  // Search
  if (searchQuery.trim()) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        task.code.toLowerCase().includes(lowerQuery) ||
        (task.jobType && task.jobType.toLowerCase().includes(lowerQuery))
    );
  }

  const newTasks = filteredTasks.filter((t) => t.status === "New");
  const activeTasks = filteredTasks.filter((t) => t.status === "Running");
  const completedTasks = filteredTasks.filter((t) => t.status === "Done");
  const rejectedTasks = filteredTasks.filter((t) => t.status === "Rejected");

  return (
    <div className="space-y-8">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">
                Selamat datang, {user?.name || "-"}
              </p>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">
                Dasbor Pekerjaan
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Kelola prioritas harian dan pantau progres tim di satu tempat.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pekerjaan, kode, atau jenis..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between sm:justify-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide shadow-inner">
              <span>Terdata</span>
              <span className="text-base text-slate-900">
                {filteredTasks.length}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 text-white p-6 flex flex-col gap-6 shadow-lg border border-blue-500/30">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">
              Status Tim
            </p>
            <p className="text-2xl font-semibold mt-2">
              {newTasks.length} tugas baru
            </p>
            <p className="text-sm text-white/80">
              Menunggu distribusi dan konfirmasi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20">
              <p className="text-xs text-white/70 uppercase tracking-wide">
                Aktif
              </p>
              <p className="text-xl font-bold">{activeTasks.length}</p>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-3 border border-white/20">
              <p className="text-xs text-white/70 uppercase tracking-wide">
                Selesai
              </p>
              <p className="text-xl font-bold">{completedTasks.length}</p>
            </div>
          </div>
          {user.role === "TEAM_LEADER" ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/10 hover:bg-blue-50 transition-transform hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Pekerjaan</span>
            </button>
          ) : (
            <div className="text-sm text-white/80 bg-white/10 rounded-xl px-4 py-3 border border-white/10">
              Fokus pada {activeTasks.length || "tidak ada"} pekerjaan aktif dan{" "}
              {newTasks.length || "tidak ada"} pekerjaan baru.
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          label="Semua Pekerjaan"
          value={filteredTasks.length}
          icon={CheckSquare}
          color="text-blue-600"
        />
        <StatCard
          label="Dalam Pengerjaan"
          value={activeTasks.length}
          icon={Clock}
          color="text-orange-600"
        />
        <StatCard
          label="Selesai"
          value={completedTasks.length}
          icon={CheckSquare}
          color="text-green-600"
        />
        <StatCard
          label="Ditolak"
          value={rejectedTasks.length}
          icon={XCircle}
          color="text-red-800"
        />
        <StatCard
          label="Urgent"
          value={filteredTasks.filter((t) => t.priority === "High").length}
          icon={AlertCircle}
          color="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-6">
        {/* New + Running */}
        <div className="space-y-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* New Tasks */}
          <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm"></div>{" "}
              Pekerjaan Baru
            </h3>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {newTasks.length}
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {newTasks.length > 0 ? (
              newTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  user={user}
                  onTaskClick={onTaskClick}
                  onAcceptTask={onAcceptTask}
                  setRejectModalTaskId={setRejectModalTaskId}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">
                  Tidak ada pekerjaan baru.
                </p>
              </div>
            )}
          </div>

          <div className="h-px bg-gray-100 border-t border-b border-gray-200"></div>

          {/* Active Tasks */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-orange-50/40">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
              <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm"></div>{" "}
              Dalam Pengerjaan
            </h3>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
              {activeTasks.length}
            </span>
          </div>

          <div className="divide-y divide-gray-50">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  user={user}
                  onTaskClick={onTaskClick}
                  onAcceptTask={onAcceptTask}
                  setRejectModalTaskId={setRejectModalTaskId}
                />
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">
                  Tidak ada pekerjaan aktif.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Done + Rejected */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50/40">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm"></div>{" "}
                Selesai
              </h3>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {completedTasks.length}
              </span>
            </div>

            <div className="divide-y divide-gray-50 flex-1 opacity-80 hover:opacity-100 transition-opacity">
              {completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    user={user}
                    onTaskClick={onTaskClick}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-sm text-gray-400">
                    Belum ada pekerjaan selesai.
                  </p>
                </div>
              )}
            </div>
          </div>

          {rejectedTasks.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-red-50/40">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm"></div>{" "}
                  Ditolak
                </h3>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {rejectedTasks.length}
                </span>
              </div>

              <div className="divide-y divide-gray-50 flex-1 opacity-80 hover:opacity-100 transition-opacity">
                {rejectedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    user={user}
                    onTaskClick={onTaskClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateTaskModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSubmit={onAddTask}
          currentTaskCount={tasks.length}
        />
      )}

      {rejectModalTaskId && (
        <RejectTaskModal
          taskId={rejectModalTaskId}
          onClose={() => setRejectModalTaskId(null)}
          onConfirm={onRejectTask}
        />
      )}
      {/* {showLetterGen && (
        <LetterGeneratorModal onClose={() => setShowLetterGen(false)} />
      )} */}
    </div>
  );
}
