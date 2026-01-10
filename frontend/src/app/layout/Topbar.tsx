import { useAuth } from "../providers/AuthProvider";
import { LogOut, Sparkles } from "lucide-react";

export const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/60 bg-slate-950/80 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
        <Sparkles className="h-4 w-4 text-violet-400" />
        <span className="hidden sm:inline">AI Fitness Coach</span>
        <span className="inline sm:hidden">AI Coach</span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <span className="hidden text-xs text-slate-400 sm:inline">
            logged in as{" "}
            <span className="font-medium text-slate-100">{user.email}</span>
          </span>
        )}

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-sm transition hover:border-violet-500/80 hover:bg-slate-900 hover:text-white hover:shadow-violet-500/20"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">Logout</span>
        </button>
      </div>
    </header>
  );
};
