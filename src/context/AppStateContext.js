import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
} from "react";
import { INITIAL_TASKS, INITIAL_USERS } from "../data/mockData";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  // simple "routing" state (dashboard / detail)
  const [view, setView] = useState("login");
  const [activeTaskId, setActiveTaskId] = useState(null);

  // ---- ACTIONS ----
  const login = useCallback((username, password) => {
    const found = INITIAL_USERS.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) return { ok: false, message: "Username / password salah" };

    setUser(found);
    setView("dashboard");
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setView("login");
    setActiveTaskId(null);
  }, []);

  const openTask = useCallback((taskId) => {
    setActiveTaskId(taskId);
    setView("taskDetail");
  }, []);

  const backToDashboard = useCallback(() => {
    setActiveTaskId(null);
    setView("dashboard");
  }, []);

  // helper: get active task
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) || null,
    [tasks, activeTaskId]
  );

  // Example: update a task safely
  const updateTask = useCallback((taskId, patch) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
  }, []);

  const addTask = useCallback((newTask) => {
    setTasks((prev) => {
      const nextId =
        prev.reduce((max, task) => Math.max(max, task.id || 0), 0) + 1;
      const normalizedTask = {
        ...newTask,
        id: nextId,
        code: newTask.code || `TASK-${String(nextId).padStart(4, "0")}`,
        createdAt: newTask.createdAt || new Date().toISOString(),
        comments: newTask.comments ?? [],
        reopenRequested: newTask.reopenRequested ?? false,
        status: newTask.status || "New",
      };

      return [...prev, normalizedTask];
    });
  }, []);

  const addComment = useCallback(
    (taskId, payload) => {
      if (!payload) return;
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== taskId) return task;
          const nextComment = {
            id: `c-${taskId}-${Date.now()}`,
            text: payload.text ?? "",
            attachment: payload.attachment ?? null,
            createdAt: new Date().toISOString(),
            authorId: user?.id ?? "unknown",
            authorName: user?.name ?? "Unknown",
            role: user?.role ?? "",
          };
          const existingComments = Array.isArray(task.comments)
            ? task.comments
            : [];
          return {
            ...task,
            comments: [...existingComments, nextComment],
          };
        })
      );
    },
    [user]
  );

  const closeTask = useCallback(
    (taskId, note) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "Done",
                completedAt: new Date().toISOString(),
                closeNote: note || "",
                closedById: user?.id ?? null,
                closedByName: user?.name ?? "",
                reopenRequested: false,
                reopenReason: null,
                reopenRequestedBy: null,
                reopenRequestedByName: null,
              }
            : task
        )
      );
    },
    [user]
  );

  const requestReopen = useCallback(
    (taskId, reason) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                reopenRequested: true,
                reopenReason: reason || "",
                reopenRequestedBy: user?.id ?? null,
                reopenRequestedByName: user?.name ?? "",
                reopenRequestedAt: new Date().toISOString(),
              }
            : task
        )
      );
    },
    [user]
  );

  const reopenTask = useCallback(
    (taskId, note) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "Running",
                reopenRequested: false,
                reopenReason: null,
                reopenRequestedBy: null,
                reopenRequestedByName: null,
                reopenedAt: new Date().toISOString(),
                reopenHandledById: user?.id ?? null,
                reopenHandledByName: user?.name ?? "",
                reopenHandledNote: note || "",
              }
            : task
        )
      );
    },
    [user]
  );

  const acceptTask = useCallback(
    (taskId) => {
      updateTask(taskId, { status: "Running" });
    },
    [updateTask]
  );

  const rejectTask = useCallback(
    (taskId, reason) => {
      updateTask(taskId, { status: "Rejected", rejectReason: reason });
    },
    [updateTask]
  );

  const value = useMemo(
    () => ({
      user,
      tasks,
      view,
      activeTaskId,
      activeTask,

      login,
      logout,
      openTask,
      backToDashboard,
      updateTask,
      setTasks, // keep if you still need direct control

      addTask,
      addComment,
      closeTask,
      requestReopen,
      reopenTask,
      acceptTask,
      rejectTask,
    }),
    [
      user,
      tasks,
      view,
      activeTaskId,
      activeTask,
      login,
      logout,
      openTask,
      backToDashboard,
      updateTask,
      addTask,
      addComment,
      closeTask,
      requestReopen,
      reopenTask,
      acceptTask,
      rejectTask,
    ]
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
