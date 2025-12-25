import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { INITIAL_TASKS, INITIAL_USERS } from "../data/mockData";
// import { supabase } from "../supabaseClient"; // Uncomment when ready for real backend

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  // Auth State
  const [user, setUser] = useState(() => {
    // Persist login across refreshes (Basic implementation)
    const saved = localStorage.getItem("odt_user");
    return saved ? JSON.parse(saved) : null;
  });

  // Data State
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync user to localStorage
  useEffect(() => {
    if (user) localStorage.setItem("odt_user", JSON.stringify(user));
    else localStorage.removeItem("odt_user");
  }, [user]);

  // ---- AUTH ACTIONS ----
  const login = useCallback(async (username, password) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));

    // REAL BACKEND TODO:
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    const found = INITIAL_USERS.find(
      (u) => u.username === username && u.password === password
    );

    setIsLoading(false);

    if (!found) {
      return { ok: false, message: "Username atau password tidak ditemukan." };
    }

    setUser(found);
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // window.location.href = "/"; // Optional: Force reload
  }, []);

  // ---- TASK ACTIONS ----

  // Generic helper to update local state (Mock DB)
  const updateTaskLocal = (taskId, patch) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
  };

  const addTask = useCallback((newTask) => {
    setTasks((prev) => {
      const nextId =
        prev.length > 0 ? Math.max(...prev.map((t) => t.id)) + 1 : 1;
      const normalizedTask = {
        ...newTask,
        id: nextId,
        code: newTask.code || `TASK-${String(nextId).padStart(4, "0")}`,
        createdAt: new Date().toISOString(),
        comments: [],
        status: "New",
        // Default assignments
        assigneeId: null,
        teamId: newTask.teamId || 1, // Default team
      };
      return [normalizedTask, ...prev];
    });
  }, []);

  const addComment = useCallback(
    (taskId, payload) => {
      if (!payload?.text) return;

      const newComment = {
        id: `c-${taskId}-${Date.now()}`,
        text: payload.text,
        attachment: payload.attachment || null,
        createdAt: new Date().toISOString(),
        authorId: user?.id || "unknown",
        authorName: user?.name || "Unknown",
        role: user?.role || "",
      };

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id !== taskId) return t;
          return { ...t, comments: [...(t.comments || []), newComment] };
        })
      );
    },
    [user]
  );

  const updateTaskStatus = useCallback((taskId, status, extraFields = {}) => {
    updateTaskLocal(taskId, { status, ...extraFields });
  }, []);

  const acceptTask = useCallback(
    (taskId) => {
      updateTaskStatus(taskId, "Running", {
        startedAt: new Date().toISOString(),
      });
    },
    [updateTaskStatus]
  );

  const rejectTask = useCallback(
    (taskId, reason) => {
      updateTaskStatus(taskId, "Rejected", {
        rejectReason: reason,
        rejectedAt: new Date().toISOString(),
        rejectedBy: user?.id,
      });
    },
    [updateTaskStatus, user]
  );

  const closeTask = useCallback(
    (taskId, note) => {
      updateTaskStatus(taskId, "Done", {
        completedAt: new Date().toISOString(),
        closeNote: note,
        closedById: user?.id,
        closedByName: user?.name,
      });
    },
    [updateTaskStatus, user]
  );

  const requestReopen = useCallback(
    (taskId, reason) => {
      updateTaskLocal(taskId, {
        reopenRequested: true,
        reopenReason: reason,
        reopenRequestedBy: user?.id,
        reopenRequestedByName: user?.name,
        reopenRequestedAt: new Date().toISOString(),
      });
    },
    [user]
  );

  const reopenTask = useCallback((taskId, note) => {
    updateTaskLocal(taskId, {
      status: "Running",
      reopenRequested: false,
      reopenedAt: new Date().toISOString(),
      reopenHandledNote: note,
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      tasks,
      isLoading,
      error,
      login,
      logout,
      addTask,
      addComment,
      acceptTask,
      rejectTask,
      closeTask,
      requestReopen,
      reopenTask,
    }),
    [
      user,
      tasks,
      isLoading,
      error,
      login,
      logout,
      addTask,
      addComment,
      acceptTask,
      rejectTask,
      closeTask,
      requestReopen,
      reopenTask,
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
