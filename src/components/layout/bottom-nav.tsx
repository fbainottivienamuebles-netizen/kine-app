"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Calendar, CheckSquare, Users, MoreHorizontal,
  DollarSign, ClipboardList, BookOpen, BarChart2, X, LogOut,
} from "lucide-react";

type BottomNavProps = { rol: string };

const MAIN_ITEMS = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/kine/agenda", label: "Agenda", icon: Calendar },
  { href: "/gym/asistencias", label: "Clases", icon: CheckSquare },
  { href: "/kine/pacientes", label: "Pacientes", icon: Users },
];

const MORE_ITEMS = [
  { href: "/kine/cobranza", label: "Cobranza Kine", icon: DollarSign },
  { href: "/gym/pacientes", label: "Miembros Gym", icon: Users },
  { href: "/gym/rutinas", label: "Rutinas", icon: ClipboardList },
  { href: "/gym/biblioteca", label: "Biblioteca", icon: BookOpen },
  { href: "/gym/cobranza", label: "Cobranza Gym", icon: DollarSign },
];

const MORE_ADMIN = [
  { href: "/reportes", label: "Reportes", icon: BarChart2 },
];

export function BottomNav({ rol }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [masOpen, setMasOpen] = useState(false);

  const masItems = rol === "ADMIN" ? [...MORE_ITEMS, ...MORE_ADMIN] : MORE_ITEMS;

  const isMoreActive = masItems.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E2E8F0] flex items-stretch h-[64px] shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        {MAIN_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <Icon
                className="w-6 h-6"
                style={{ color: active ? "#0EA5E9" : "#94A3B8" }}
              />
              <span
                className="text-[10px] font-medium leading-tight"
                style={{ color: active ? "#0EA5E9" : "#94A3B8" }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Más button */}
        <button
          onClick={() => setMasOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
        >
          <MoreHorizontal
            className="w-6 h-6"
            style={{ color: isMoreActive ? "#0EA5E9" : "#94A3B8" }}
          />
          <span
            className="text-[10px] font-medium leading-tight"
            style={{ color: isMoreActive ? "#0EA5E9" : "#94A3B8" }}
          >
            Más
          </span>
        </button>
      </nav>

      {/* Más drawer */}
      {masOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMasOpen(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-[20px] pb-[env(safe-area-inset-bottom)] shadow-xl">
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#F1F5F9]">
              <span className="text-sm font-semibold text-[#0F172A]">Más opciones</span>
              <button
                onClick={() => setMasOpen(false)}
                className="p-1.5 rounded-full bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3">
              {masItems.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMasOpen(false)}
                    className={[
                      "flex items-center gap-3 px-3 py-3 rounded-[10px] mb-1 transition-colors",
                      active
                        ? "bg-[#F0F9FF] text-[#0EA5E9]"
                        : "text-[#334155] hover:bg-[#F8FAFC]",
                    ].join(" ")}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                  </Link>
                );
              })}
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-[10px] w-full text-left text-[#EF4444] hover:bg-[#FEF2F2] transition-colors mt-2"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </div>
            {/* Bottom spacer for phones without home button */}
            <div className="h-4" />
          </div>
        </div>
      )}
    </>
  );
}
