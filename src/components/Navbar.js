import React, { useMemo, useState } from "react";
import { Briefcase, Bell, LogOut, FileText } from "lucide-react";

export default function Navbar({
  user,
  tasks = [],
  onLogout,
  onNotificationClick = () => {},
  readNotifications,
  onOpenLetterModal = () => {},
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const safeReadNotifications = useMemo(() => {
    if (readNotifications && typeof readNotifications.has === "function") {
      return readNotifications;
    }
    return new Set();
  }, [readNotifications]);

  let allNotifications = [];

  if (user.role === "TEAM_MEMBER") {
    allNotifications = tasks
      .filter((t) => t.assigneeId === user.id && t.status === "New")
      .map((t) => ({
        ...t,
        type: "ASSIGNMENT",
        label: "Pekerjaan Baru",
      }));
  } else if (user.role === "TEAM_LEADER") {
    const doneTasks = tasks
      .filter((t) => t.teamId === user.teamId && t.status === "Done")
      .map((t) => ({ ...t, type: "DONE", label: "Pekerjaan Selesai" }));
    const acceptedTasks = tasks
      .filter((t) => t.teamId === user.teamId && t.status === "Running")
      .map((t) => ({ ...t, type: "ACCEPTED", label: "Pekerjaan Diterima" }));
    const rejectedTasks = tasks
      .filter((t) => t.teamId === user.teamId && t.status === "Rejected")
      .map((t) => ({ ...t, type: "REJECTED", label: "Pekerjaan Ditolak" }));
    const reopenTasks = tasks
      .filter((t) => t.teamId === user.teamId && t.reopenRequested)
      .map((t) => ({ ...t, type: "REOPEN", label: "Permintaan Buka Kembali" }));
    allNotifications = [
      ...doneTasks,
      ...acceptedTasks,
      ...rejectedTasks,
      ...reopenTasks,
    ];
  }

  const unreadNotifications = allNotifications.filter(
    (n) => !safeReadNotifications.has(`${n.id}-${n.type}`)
  );
  const notificationCount = unreadNotifications.length;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-1.5 rounded">
            <Briefcase className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 hidden sm:block">
            Office Daily Task
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenLetterModal}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 transition"
          >
            <FileText className="w-4 h-4" />
            <span>Buat Surat</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1 rounded-full hover:bg-slate-100 relative"
            >
              <Bell className="w-6 h-6 text-slate-400" />
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {notificationCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">
                    Notifications
                  </h3>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">
                    {notificationCount} New
                  </span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {unreadNotifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada notifikasi baru.
                    </div>
                  ) : (
                    unreadNotifications.map((task) => (
                      <div
                        key={`${task.id}-${task.type}`}
                        onClick={() => {
                          onNotificationClick(task, task.type);
                          setShowNotifications(false);
                        }}
                        className="p-3 border-b border-gray-50 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <div className="flex gap-2 mb-1 items-center">
                          <span className="text-[10px] font-mono bg-slate-100 px-1 rounded text-slate-500">
                            {task.code}
                          </span>
                          <span className="text-[10px] font-bold text-blue-600">
                            {task.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 line-clamp-1">
                          {task.title}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block">
              {user.role.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
