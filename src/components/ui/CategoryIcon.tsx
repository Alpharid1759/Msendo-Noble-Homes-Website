// src/components/ui/CategoryIcon.tsx
import {
  BedDouble,
  Briefcase,
  Building2,
  ChartLine,
  ClipboardList,
  Construction,
  Gem,
  Home,
  KeyRound,
  Landmark,
  Map,
  Store,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  home: Home,
  building: Building2,
  map: Map,
  store: Store,
  briefcase: Briefcase,
  warehouse: Warehouse,
  key: KeyRound,
  gem: Gem,
  landmark: Landmark,
  wrench: Wrench,
  chart: ChartLine,
  crane: Construction,
  bed: BedDouble,
  clipboard: ClipboardList,
};

export function CategoryIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  const Icon = (name && MAP[name]) || Home;
  return <Icon className={className} aria-hidden="true" />;
}
