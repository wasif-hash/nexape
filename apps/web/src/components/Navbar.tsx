import { useAuthStore } from "@/lib/auth-store";
import { Button } from "./ui/Button";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-brand-600" />
          <span className="font-semibold text-slate-900">Nexape CRM</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <span className="text-sm text-slate-600">{user.name}</span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => clear()}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
