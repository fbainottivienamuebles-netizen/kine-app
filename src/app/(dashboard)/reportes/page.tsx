import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReportesPage() {
  const session = await getSession();
  if (session?.rol !== "ADMIN") redirect("/dashboard");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-500 text-sm mt-1">Solo disponible para administradora</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-gray-400">Reportes y exportaciones — Fase 6</p>
      </div>
    </div>
  );
}
