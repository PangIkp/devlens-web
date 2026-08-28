import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, FolderGit2, GitPullRequest, LayoutDashboard, Lightbulb, Settings } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/repositories", label: "Repositories", icon: FolderGit2 },
  { to: "/pull-requests", label: "Pull Requests", icon: GitPullRequest },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <aside
      className={cn(
        "relative z-20 shrink-0 border-r border-border/80 bg-card/80 backdrop-blur transition-all",
        sidebarOpen ? "w-20 md:w-72" : "w-20",
      )}
    >
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-pressed={sidebarOpen}
        className="absolute -right-3.5 top-8 hidden h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-colors hover:bg-muted hover:text-foreground md:inline-flex"
      >
        {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      <div className="h-full overflow-y-auto px-4 py-6">
        <div className="mb-8 px-3">
          {sidebarOpen ? (
            <BrandLogo
              className="hidden w-full justify-start overflow-hidden md:flex"
              imageClassName="h-14 w-[13.5rem] max-w-none object-cover object-left"
              fallbackClassName="max-w-[12rem]"
            />
          ) : null}
        </div>
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  sidebarOpen ? "justify-center md:justify-start" : "justify-center",
                )}
                activeProps={{
                  className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                }}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span aria-hidden="true" className={cn("truncate", sidebarOpen ? "hidden md:inline" : "hidden")}>
                  {item.label}
                </span>
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
