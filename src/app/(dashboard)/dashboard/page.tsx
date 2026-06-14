import { getSession } from "@/lib/auth";
import {
  Calendar,
  Dumbbell,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {session?.nombre?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Calendar className="w-6 h-6 text-indigo-600" />}
          titulo="Turnos hoy"
          valor="—"
          subtitulo="Kinesiología"
          color="bg-indigo-50"
        />
        <StatCard
          icon={<Dumbbell className="w-6 h-6 text-emerald-600" />}
          titulo="Gimnasio hoy"
          valor="—"
          subtitulo="Pacientes esperados"
          color="bg-emerald-50"
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-amber-600" />}
          titulo="Rutinas por vencer"
          valor="—"
          subtitulo="Próximos 7 días"
          color="bg-amber-50"
        />
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-red-600" />}
          titulo="Cobros pendientes"
          valor="—"
          subtitulo="Ambos módulos"
          color="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard titulo="Turnos de hoy" enlace="/kine/agenda">
          <EmptyState mensaje="Conectá la base de datos para ver los turnos de hoy" />
        </SectionCard>
        <SectionCard titulo="Clase de hoy — Gimnasio" enlace="/gym/asistencias">
          <EmptyState mensaje="Conectá la base de datos para ver los pacientes del gimnasio" />
        </SectionCard>
        <SectionCard titulo="Rutinas por renovar" enlace="/gym/rutinas">
          <EmptyState mensaje="Sin alertas de rutinas por vencer" />
        </SectionCard>
        <SectionCard titulo="Cobros pendientes" enlace="/kine/cobranza">
          <EmptyState mensaje="Sin cobros pendientes" />
        </SectionCard>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  titulo,
  valor,
  subtitulo,
  color,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: string | number;
  subtitulo: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{valor}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitulo}</p>
    </div>
  );
}

function SectionCard({
  titulo,
  enlace,
  children,
}: {
  titulo: string;
  enlace: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
        <h2 className="font-semibold text-gray-800">{titulo}</h2>
        <a href={enlace} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
          Ver todo
        </a>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <p className="text-sm text-gray-400 text-center py-4">{mensaje}</p>
  );
}
