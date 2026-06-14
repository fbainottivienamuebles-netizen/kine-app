"use client";

import { useRouter } from "next/navigation";
import type { JwtPayload } from "@/lib/auth";
import { LogOut, User } from "lucide-react";

export function Header({ usuario }: { usuario: JwtPayload }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="md:hidden w-8" /> {/* spacer para el botón de menú mobile */}
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="hidden sm:block">
            <p className="font-medium text-gray-800 leading-tight">{usuario.nombre}</p>
            <p className="text-xs text-gray-400 leading-tight capitalize">
              {usuario.rol === "ADMIN" ? "Administradora" : "Asistente"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
