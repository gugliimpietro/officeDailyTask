import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
} from "react";
import { INITIAL_TASKS, INITIAL_USERS } from "../data/mockData";
import { supabase } from "../supabaseClient";

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

  // Messages/Warnings State
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("odt_messages");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync user to localStorage
  useEffect(() => {

    if (user) localStorage.setItem("odt_user", JSON.stringify(user));
    else localStorage.removeItem("odt_user");
  }, [user]);

  // ---- AUTH ACTIONS ----
  const login = useCallback(async (username, password) => {
    setIsLoading(true);

    try {
      // 1. Validate against Supabase Database (Source of Truth for Credentials) 

      const { data: dbUser, error } = await supabase
        .from("users")
        .select("*")
        .ilike("username", username)
        .eq("password", password)
        .maybeSingle();

      if (error) {
        console.error("Supabase Login Error:", error);
        setIsLoading(false);
        return { ok: false, message: "Terjadi kesalahan sistem saat login." };
      }

      if (!dbUser) {
        setIsLoading(false);
        return { ok: false, message: "Username atau password salah (Cek Database)." };
      }

      // 2. Map to App User Structure (Prefer Mock Data for Roles/Teams if available to preserve UI logic)
      const mockProfile = INITIAL_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());

      let finalUser;
      if (mockProfile) {
        finalUser = { ...mockProfile, ...dbUser }; // Merge (DB takes precedence for basics, Mock for IDs)
        // Ensure ID from Mock is preserved if it links to Tasks
        finalUser.id = mockProfile.id;
        finalUser.teamId = mockProfile.teamId;
        finalUser.role = mockProfile.role;
      } else {
        // New User (Not in Mock) -> Construct minimal profile
        // Map Team 'PDEJP' -> 't1' (Hypothetical mapping)
        const teamMap = { 'PDEJP': 't1' };
        const roleMap = { 'team leader': 'TEAM_LEADER', 'team member': 'TEAM_MEMBER' };

        finalUser = {
          id: dbUser.id.toString(),
          username: dbUser.username,
          name: dbUser.username, // or add name col
          email: dbUser.email,
          role: roleMap[dbUser.position?.toLowerCase()] || 'TEAM_MEMBER',
          teamId: teamMap[dbUser.team] || 't1' // Default to t1 to see tasks
        };
      }

      setUser(finalUser);
      setIsLoading(false);
      return { ok: true };

    } catch (e) {
      console.error("Login Exception:", e);
      setIsLoading(false);
      return { ok: false, message: "Gagal login: " + e.message };
    }
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

  const sendMessage = useCallback((toUser, taskId, title, body) => {
    if (!user) return;

    // 1. Create Message/Warning
    const newMessage = {
      id: `msg-${Date.now()}`,
      fromUserId: user.id,
      fromUserName: user.name,
      toUserId: toUser.id,
      toUserName: toUser.name,
      taskId: taskId,
      title: title,
      body: body,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    setMessages(prev => [newMessage, ...prev]);

    // 2. Add System Comment
    // "sadiro send message warning to maya about "title message" "
    const commentText = `${user.name} send message warning to ${toUser.name} about "${title}"`;

    // We can reuse addComment logic but we need to call the setTask state updater directly 
    // or call addComment if it wasn't dependent on a specific closure.
    // addComment relies on "user" from scope, which is fine.
    // However, addComment expects a payload object.

    // Let's manually invoke the logic of addComment here to be safe or just call it if available.
    // addComment is defined in scope.

    // Replicating addComment logic to ensure the specific format is forced
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newComment = {
          id: `c-${taskId}-${Date.now()}-sys`,
          text: commentText,
          attachment: null,
          createdAt: new Date().toISOString(),
          authorId: "SYSTEM", // or user.id? Request implies user action, but maybe distinct style?
          authorName: user.name, // Keep it as the sender
          role: user.role,
          isSystem: true // Optional flag for styling
        };
        return { ...t, comments: [...(t.comments || []), newComment] };
      })
    );

  }, [user]); // Depend on user for 'from' details

  const markMessageRead = useCallback((msgId) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: true } : m));
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
      messages,
      sendMessage,
      markMessageRead,
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
      messages,
      sendMessage,
      reopenTask,
    ]
  );

  // Persist messages to localStorage
  useEffect(() => {
    localStorage.setItem("odt_messages", JSON.stringify(messages));
  }, [messages]);

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
