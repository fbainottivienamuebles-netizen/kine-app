"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, DollarSign,
  ClipboardList, CheckSquare, BarChart2, BookOpen, LogOut, User,
} from "lucide-react";
import type { JwtPayload } from "@/lib/auth";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  soloAdmin?: boolean;
};

const navPacientes: NavItem[] = [
  { href: "/pacientes", label: "Pacientes", icon: Users },
];

const navKine: NavItem[] = [
  { href: "/kine/agenda", label: "Agenda", icon: Calendar },
  { href: "/kine/cobranza", label: "Cobranza", icon: DollarSign },
];

const navGym: NavItem[] = [
  { href: "/gym/asistencias", label: "Asistencias", icon: CheckSquare },
  { href: "/gym/rutinas", label: "Rutinas", icon: ClipboardList },
  { href: "/gym/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/gym/cobranza", label: "Cobranza", icon: DollarSign },
];

const navAdmin: NavItem[] = [
  { href: "/reportes", label: "Reportes", icon: BarChart2, soloAdmin: true },
];

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
  return (
    <li>
      <Link
        href={item.href}
        className={[
          "flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors border-l-[3px]",
          active
            ? "bg-[#1E293B] text-white border-l-[#0EA5E9]"
            : "text-[#94A3B8] border-l-transparent hover:bg-[#1E293B]/60 hover:text-[#CBD5E1]",
        ].join(" ")}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {item.label}
      </Link>
    </li>
  );
}

function NavSection({ title, items, rol, pathname }: {
  title: string;
  items: NavItem[];
  rol: string;
  pathname: string;
}) {
  const visibles = items.filter((i) => !i.soloAdmin || rol === "ADMIN");
  if (visibles.length === 0) return null;
  return (
    <div className="mb-5">
      <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#475569]">
        {title}
      </p>
      <ul className="space-y-0.5">
        {visibles.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
      </ul>
    </div>
  );
}

export function Sidebar({ rol, usuario }: { rol: string; usuario: JwtPayload }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex md:flex-col w-60 bg-[#0F172A] flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1E293B]">
        <div className="text-lg font-bold text-white tracking-tight">KineApp</div>
        <div className="text-xs text-[#475569] mt-0.5">Gestión integral</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-5">
          <ul className="space-y-0.5">
            <SidebarLink
              item={{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }}
              pathname={pathname}
            />
          </ul>
        </div>
        <NavSection title="Pacientes" items={navPacientes} rol={rol} pathname={pathname} />
        <NavSection title="Kinesiología" items={navKine} rol={rol} pathname={pathname} />
        <NavSection title="Gimnasio" items={navGym} rol={rol} pathname={pathname} />
        <NavSection title="Administración" items={navAdmin} rol={rol} pathname={pathname} />
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-[#1E293B]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-[#94A3B8]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{usuario.nombre}</p>
            <p className="text-xs text-[#475569] capitalize">
              {usuario.rol === "ADMIN" ? "Administradora" : "Asistente"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[#475569] hover:text-white hover:bg-[#1E293B] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
