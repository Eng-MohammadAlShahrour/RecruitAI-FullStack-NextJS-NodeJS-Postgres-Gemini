import { Nav } from "@/components/Nav";
import { PlanBadge } from "@/components/PlanBadge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="plan-badge-wrap">
        <PlanBadge />
      </div>
      {children}
    </>
  );
}