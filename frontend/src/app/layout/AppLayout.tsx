import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const AppLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="relative flex min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 top-[-10%] h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute right-[-40px] top-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-[-20%] left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <Sidebar />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 animate-fade-in">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
