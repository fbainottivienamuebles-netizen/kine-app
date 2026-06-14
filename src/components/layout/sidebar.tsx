"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Dumbbell,
  ClipboardList,
  CheckSquare,
  BarChart2,
  BookOpen,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  soloAdmin?: boolean;
};

const navKine: NavItem[] = [
  { href: "/kine/agenda", label: "Agenda", icon: Calendar },
  { href: "/kine/pacientes", label: "Pacientes", icon: Users },
  { href: "/kine/cobranza", label: "Cobranza", icon: DollarSign },
];

const navGym: NavItem[] = [
  { href: "/gym/pacientes", label: "Pacientes", icon: Users },
  { href: "/gym/asistencias", label: "Asistencias hoy", icon: CheckSquare },
  { href: "/gym/rutinas", label: "Rutinas", icon: ClipboardList },
  { href: "/gym/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/gym/cobranza", label: "Cobranza", icon: DollarSign },
];

const navReportes: NavItem[] = [
  { href: "/reportes", label: "Reportes", icon: BarChart2, soloAdmin: true },
];

function NavSection({
  title,
  items,
  rol,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  rol: string;
  pathname: string;
  onNavigate?: () => void;
}) {
  const visibles = items.filter((item) => !item.soloAdmin || rol === "ADMIN");
  if (visibles.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        {title}
      </p>
      <ul className="space-y-1">
        {visibles.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Sidebar({ rol }: { rol: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const content = (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="text-lg font-bold text-gray-900">KineApp</div>
        <div className="text-xs text-gray-400 mt-0.5">Gestión integral</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-6">
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/dashboard"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
            </li>
          </ul>
        </div>

        <NavSection
          title="Kinesiología"
          items={navKine}
          rol={rol}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
        <NavSection
          title="Gimnasio"
          items={[{ href: "/gym/asistencias", label: "Asistencias hoy", icon: CheckSquare }, ...navGym.filter(i => i.href !== "/gym/asistencias")]}
          rol={rol}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
        <NavSection
          title="Administración"
          items={navReportes}
          rol={rol}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden bg-white rounded-xl p-2 shadow-md border border-gray-200"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Menú"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {content}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 bg-white border-r border-gray-200 flex-shrink-0">
        {content}
      </aside>
    </>
  );
}
