import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppStateProvider, useAppState } from "./context/AppStateContext";

import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import TaskDetail from "./components/TaskDetail";
import Toast from "./components/Toasts";
import LetterGeneratorModal from "./components/LetterGeneratorModal";
import LandingPage from "./components/LandingPage";

const LETTER_TEMPLATE_CONFIG = {
  mode: "gdrive",
  // Your Apps Script Web App URL (we will create this below)
  gdriveProxyUrl:
    "https://script.google.com/macros/s/AKfycby2NVET8I7XlBZLnhgwg0UK_ziMgHtC05hK9w89fRSrRczdJRcUdLXojm-NboalY2Jw/exec",

  // Map keys => template source
  templates: {
    internal_undangan: { source: "gdrive", fileId: "FILE_ID_1" },
    internal_hasil: { source: "gdrive", fileId: "FILE_ID_2" },
    external_undangan: { source: "gdrive", fileId: "FILE_ID_3" },
    external_hasil: { source: "gdrive", fileId: "FILE_ID_4" },
  },
};

function AppShell() {
  const {
    user,
    view,
    activeTask,
    login,
    logout,
    openTask,
    backToDashboard,
    tasks,
    addTask,
    addComment,
    closeTask,
    requestReopen,
    reopenTask,
    acceptTask,
    rejectTask,
    startLogin,
    backToLanding,
  } = useAppState();
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("info");
  const [toastKey, setToastKey] = useState(0);
  const [toastAction, setToastAction] = useState(null);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [readNotifications, setReadNotifications] = useState(() => new Set());
  const memberSeenTasksRef = useRef(new Set());

  const showToast = useCallback((message, variant = "info", options = {}) => {
    if (!message) return;
    setToastVariant(variant);
    setToastKey(Date.now());
    setToastMessage(message);
    setToastAction(() => options.onClick || null);
  }, []);

  const handleToastClose = useCallback(() => {
    setToastMessage("");
    setToastAction(null);
  }, []);

  const openLetterModal = useCallback(() => setShowLetterModal(true), []);
  const closeLetterModal = useCallback(() => setShowLetterModal(false), []);

  const handleAddTask = useCallback(
    (taskPayload) => {
      addTask(taskPayload);
      showToast("Pekerjaan baru berhasil dibuat.", "success");
    },
    [addTask, showToast]
  );

  const handleNotificationClick = useCallback(
    (task, type) => {
      if (!task) return;
      setReadNotifications((prev) => {
        const next = new Set(prev);
        next.add(`${task.id}-${type}`);
        return next;
      });
      if (task.id) {
        openTask(task.id);
      }
    },
    [openTask]
  );

  useEffect(() => {
    setReadNotifications(new Set());
    memberSeenTasksRef.current = new Set();
  }, [user?.id]);

  useEffect(() => {
    if (!user || user.role !== "TEAM_MEMBER") return;
    const assignedNew = tasks.filter(
      (task) => task.assigneeId === user.id && task.status === "New"
    );
    const unseen = assignedNew.filter(
      (task) => !memberSeenTasksRef.current.has(task.id)
    );

    if (unseen.length === 0) return;

    const message =
      unseen.length === 1
        ? `Anda memiliki pekerjaan baru: "${unseen[0].title}".`
        : `Anda memiliki ${unseen.length} pekerjaan baru yang menunggu tindakan.`;

    showToast(message, "info", {
      onClick: () => {
        backToDashboard();
      },
    });
    unseen.forEach((task) => memberSeenTasksRef.current.add(task.id));
  }, [tasks, user, showToast, backToDashboard]);

  if (!user && view === "landing") {
    return <LandingPage onSignIn={startLogin} />;
  }

  if (!user || view === "login") {
    return <LoginPage onLogin={login} onBack={backToLanding} />;
  }

  return (
    <div className="relative min-h-screen bg-slate-100 text-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_55%)]" />
      <div className="relative min-h-screen flex flex-col">
        <Navbar
          user={user}
          tasks={tasks}
          onOpenLetterModal={openLetterModal}
          onLogout={logout}
          onNotificationClick={handleNotificationClick}
          readNotifications={readNotifications}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === "dashboard" && (
            <Dashboard
              user={user}
              tasks={tasks}
              onTaskClick={openTask}
              onAddTask={handleAddTask}
              onAcceptTask={acceptTask}
              onRejectTask={rejectTask}
            />
          )}
          {view === "taskDetail" && activeTask && (
            <TaskDetail
              task={activeTask}
              currentUser={user}
              onBack={backToDashboard}
              onAddComment={addComment}
              onCloseTask={closeTask}
              onRequestReopen={requestReopen}
              onReopenTask={reopenTask}
              onAcceptTask={acceptTask}
              onRejectTask={rejectTask}
            />
          )}
        </main>
      </div>
      {showLetterModal && (
        <LetterGeneratorModal
          user={user}
          onClose={closeLetterModal}
          templateConfig={LETTER_TEMPLATE_CONFIG}
        />
      )}
      {toastMessage && (
        <Toast
          key={toastKey}
          message={toastMessage}
          variant={toastVariant}
          onClose={handleToastClose}
          onClick={toastAction}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell />
    </AppStateProvider>
  );
}
