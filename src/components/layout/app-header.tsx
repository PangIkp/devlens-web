import { useUiStore } from "@/store/ui-store";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);

  return (
    <header className="flex items-center justify-between border-b border-border/80 bg-card/70 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Engineering Intelligence Platform</p>
        <h2 className="text-lg font-semibold">Frontend Foundation</h2>
      </div>
      <Button variant="outline" size="sm" onClick={toggleSidebar}>
        Toggle sidebar
      </Button>
    </header>
  );
}
