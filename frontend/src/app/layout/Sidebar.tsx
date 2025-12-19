import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Utensils,
  Dumbbell,
  ClipboardList,
  BarChart2,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

type SidebarLinkProps = {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  isActive: boolean;
  badge?: string;
};

const SidebarLink = ({
  to,
  icon: Icon,
  label,
  collapsed,
  isActive,
  badge,
}: SidebarLinkProps) => {
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
        isActive
          ? "bg-slate-800/80 text-slate-50 shadow-lg shadow-violet-500/15"
          : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-50"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className="h-5 w-5 shrink-0" />

      {!collapsed && (
        <>
          <span className="truncate">{label}</span>
          {badge && (
            <span className="ml-auto rounded-full bg-violet-500/15 px-2 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
              {badge}
            </span>
          )}
        </>
      )}

      {collapsed && (
        <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-[11px] font-medium text-slate-100 opacity-0 shadow-lg shadow-black/60 transition group-hover:opacity-100">
          {label}
        </span>
      )}
    </Link>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = window.localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });

  const setCollapsedAndStore = (value: boolean) => {
    setCollapsed(value);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "sidebar-collapsed",
        value ? "true" : "false"
      );
    }
  };

  const isPathActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const nutritionActive =
    location.pathname.startsWith("/nutrition") ||
    location.pathname.startsWith("/ai/meal-plan");

  const workoutsActive = location.pathname.startsWith("/workouts");

  const aiActive =
    location.pathname.startsWith("/ai") || location.pathname === "/ai-coach";

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[260px]";

  return (
    <aside
      className={`${sidebarWidth} relative z-30 flex flex-col border-r border-slate-800/70 bg-slate-950/95 backdrop-blur-sm transition-[width] duration-300`}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="group flex items-center gap-2 rounded-xl px-2 py-1.5 text-left"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-slate-50 shadow-md shadow-violet-500/40">
            <Sparkles className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-[0.18em] text-slate-400">
                AI FITNESS
              </span>
              <span className="text-sm font-semibold text-slate-50">Coach</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setCollapsedAndStore(!collapsed)}
          className="sidebar-toggle"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <nav className="flex-1 space-y-6 px-2 pb-6">
        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Overview
            </p>
          )}
          <SidebarLink
            to="/dashboard"
            icon={Home}
            label="Dashboard"
            collapsed={collapsed}
            isActive={isPathActive("/dashboard")}
          />
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Nutrition
            </p>
          )}
          <div
            className={`space-y-1 rounded-xl p-1 ${
              nutritionActive ? "bg-slate-900/80" : ""
            }`}
          >
            <SidebarLink
              to="/nutrition"
              icon={Utensils}
              label="Nutrition diary"
              collapsed={collapsed}
              isActive={isPathActive("/nutrition")}
            />
            <SidebarLink
              to="/ai/meal-plan"
              icon={Sparkles}
              label="AI meal plan"
              collapsed={collapsed}
              isActive={isPathActive("/ai/meal-plan")}
              badge="AI"
            />
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Workouts
            </p>
          )}
          <div
            className={`space-y-1 rounded-xl p-1 ${
              workoutsActive ? "bg-slate-900/80" : ""
            }`}
          >
            <SidebarLink
              to="/workouts/templates"
              icon={Dumbbell}
              label="Workout templates"
              collapsed={collapsed}
              isActive={isPathActive("/workouts/templates")}
            />
            <SidebarLink
              to="/workouts/logs"
              icon={ClipboardList}
              label="Workout logs"
              collapsed={collapsed}
              isActive={isPathActive("/workouts/logs")}
            />
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Progress & AI coach
            </p>
          )}
          <div
            className={`space-y-1 rounded-xl p-1 ${
              aiActive ? "bg-slate-900/80" : ""
            }`}
          >
            <SidebarLink
              to="/progress"
              icon={BarChart2}
              label="Progress"
              collapsed={collapsed}
              isActive={isPathActive("/progress")}
            />
            <SidebarLink
              to="/ai-coach"
              icon={Sparkles}
              label="AI weekly review"
              collapsed={collapsed}
              isActive={isPathActive("/ai-coach")}
              badge="AI"
            />
            <SidebarLink
              to="/ai/workout-plan"
              icon={Dumbbell}
              label="AI workout plan"
              collapsed={collapsed}
              isActive={isPathActive("/ai/workout-plan")}
              badge="AI"
            />
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Account
            </p>
          )}
          <SidebarLink
            to="/profile"
            icon={User}
            label="Profile"
            collapsed={collapsed}
            isActive={isPathActive("/profile")}
          />
        </div>
      </nav>

      <div className="border-t border-slate-800/70 px-3 py-4 text-[11px] text-slate-500">
        {!collapsed ? (
          <p>
            <span className="font-semibold text-slate-300">Tipp:</span> kérj AI
            edzéstervet vagy étrendet a gyorsabb haladáshoz.
          </p>
        ) : (
          <p className="text-center">&copy; AI Coach</p>
        )}
      </div>
    </aside>
  );
};
