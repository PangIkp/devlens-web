import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";

const navigationItems = [
  { to: "/", label: "Overview" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/repositories", label: "Repositories" },
  { to: "/settings", label: "Settings" },
] as const;

export function AppSidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <aside
      className={cn(
        "border-r border-border/80 bg-card/80 px-4 py-6 backdrop-blur transition-all",
        sidebarOpen ? "w-72" : "w-20",
      )}
    >
      <div className="mb-8 px-2">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">DevLens</p>
        {sidebarOpen ? <h1 className="mt-2 text-2xl font-bold">Frontend Foundation</h1> : null}
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
            {sidebarOpen ? item.label : item.label.slice(0, 1)}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
