import { getSession } from "@/lib/auth";
import { Calendar, Dumbbell, AlertTriangle, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Hola, {session?.nombre?.split(" ")[0]} 👋
        </h1>
        <p className="text-[#64748B] text-sm mt-1 capitalize">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-[#0EA5E9]" />}
          titulo="Turnos hoy"
          valor="—"
          subtitulo="Kinesiología"
          iconBg="bg-[#F0F9FF]"
        />
        <StatCard
          icon={<Dumbbell className="w-5 h-5 text-[#8B5CF6]" />}
          titulo="Gym hoy"
          valor="—"
          subtitulo="Pacientes esperados"
          iconBg="bg-[#F5F3FF]"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-[#F59E0B]" />}
          titulo="Rutinas por vencer"
          valor="—"
          subtitulo="Próximos 7 días"
          iconBg="bg-[#FFFBEB]"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-[#10B981]" />}
          titulo="Cobros pendientes"
          valor="—"
          subtitulo="Ambos módulos"
          iconBg="bg-[#ECFDF5]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard titulo="Turnos de hoy" enlace="/kine/agenda" accent="#0EA5E9">
          <EmptyState mensaje="Abrí la Agenda para ver los turnos de hoy" />
        </SectionCard>
        <SectionCard titulo="Clase de hoy — Gimnasio" enlace="/gym/asistencias" accent="#8B5CF6">
          <EmptyState mensaje="Abrí Asistencias para ver quién viene hoy" />
        </SectionCard>
        <SectionCard titulo="Rutinas por renovar" enlace="/gym/rutinas" accent="#8B5CF6">
          <EmptyState mensaje="Sin alertas de rutinas por vencer" />
        </SectionCard>
        <SectionCard titulo="Cobros pendientes" enlace="/kine/cobranza" accent="#0EA5E9">
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
  iconBg,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor: string | number;
  subtitulo: string;
  iconBg: string;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0] p-4 shadow-sm">
      <div className={`${iconBg} w-10 h-10 rounded-[10px] flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-[#64748B] font-medium">{titulo}</p>
      <p className="text-2xl font-bold text-[#0F172A] mt-0.5">{valor}</p>
      <p className="text-xs text-[#94A3B8] mt-0.5">{subtitulo}</p>
    </div>
  );
}

function SectionCard({
  titulo,
  enlace,
  accent,
  children,
}: {
  titulo: string;
  enlace: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9]">
        <h2 className="font-semibold text-[#0F172A] text-sm">{titulo}</h2>
        <Link href={enlace} className="text-xs font-medium transition-colors" style={{ color: accent }}>
          Ver todo →
        </Link>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ mensaje }: { mensaje: string }) {
  return (
    <p className="text-sm text-[#94A3B8] text-center py-4">{mensaje}</p>
  );
}
