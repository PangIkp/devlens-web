import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const navigationItems = [
  { to: "/", label: "Overview" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/repositories", label: "Repositories" },
  { to: "/pull-requests", label: "Pull Requests" },
  { to: "/insights", label: "Insights" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppSidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <aside
      className={cn(
        "border-r border-border/80 bg-card/80 px-4 py-6 backdrop-blur transition-all",
        // Below `md`, stay icon-width regardless of the toggle state so the
        // sidebar never eats most of a phone-sized viewport.
        sidebarOpen ? "w-20 md:w-72" : "w-20",
      )}
    >
      <div className="mb-8 px-2">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">DevLens</p>
        {sidebarOpen ? <h1 className="mt-2 hidden text-2xl font-bold md:block">DevLens Web</h1> : null}
      </div>
      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="block rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            activeProps={{
              className: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            }}
          >
            {sidebarOpen ? (
              <>
                <span className="md:hidden" aria-hidden="true">
                  {item.label.slice(0, 1)}
                </span>
                <span className="hidden md:inline" aria-hidden="true">
                  {item.label}
                </span>
              </>
            ) : (
              <span aria-hidden="true">{item.label.slice(0, 1)}</span>
            )}
            <span className="sr-only">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
