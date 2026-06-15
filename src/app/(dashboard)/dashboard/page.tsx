import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { Calendar, Dumbbell, AlertTriangle, DollarSign } from "lucide-react";
import Link from "next/link";

const ETIQUETAS_TRATAMIENTO: Record<string, string> = {
  MASAJES: "Masajes",
  REHABILITACION: "Rehabilitación",
  DRENAJE_LINFATICO: "Drenaje linfático",
  DRENAJE_BOTAS: "Drenaje botas",
  DRENAJE_KINE: "Drenaje kine",
  HIPOPRESIVOS: "Hipopresivos",
};

const DIAS_ES = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

function fechaArgentina() {
  const now = new Date();
  const ar = new Date(now.toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
  const today = ar.toISOString().slice(0, 10);
  const diaNombre = DIAS_ES[ar.getDay()];
  const en7dias = new Date(ar);
  en7dias.setDate(ar.getDate() + 7);
  const hasta7 = en7dias.toISOString().slice(0, 10);
  return { today, diaNombre, hasta7 };
}

export default async function DashboardPage() {
  const session = await getSession();
  const { today, diaNombre, hasta7 } = fechaArgentina();
  const supabase = createServiceClient();

  const [
    { data: turnosHoy },
    { data: gymHoy },
    { data: rutinasVencer },
    { data: cobrosKine },
  ] = await Promise.all([
    supabase
      .from("turnos")
      .select("id, hora_inicio, hora_fin, tipo_tratamiento, estado, usa_botas, paciente:pacientes(id, nombre, dni)")
      .eq("fecha", today)
      .not("estado", "in", "(CANCELADO)")
      .order("hora_inicio", { ascending: true }),

    supabase
      .from("pacientes")
      .select("id, nombre, telefono, dias_asignados, estado_gym")
      .eq("activo_gym", true)
      .eq("estado_gym", "ACTIVO")
      .contains("dias_asignados", [diaNombre])
      .order("nombre", { ascending: true }),

    supabase
      .from("rutinas")
      .select("id, fecha_vencimiento, paciente:pacientes(id, nombre)")
      .eq("estado", "ACTIVA")
      .gte("fecha_vencimiento", today)
      .lte("fecha_vencimiento", hasta7)
      .order("fecha_vencimiento", { ascending: true }),

    supabase
      .from("turnos")
      .select("id, fecha, hora_inicio, tipo_tratamiento, paciente:pacientes(id, nombre), cobro:cobros_kine(id)")
      .eq("estado", "PRESENTE")
      .order("fecha", { ascending: false })
      .limit(50),
  ]);

  const turnosSinCobro = (cobrosKine ?? []).filter(
    (t) => !(t.cobro as unknown as Array<unknown>)?.length
  );

  const totalTurnos = turnosHoy?.length ?? 0;
  const totalGym = gymHoy?.length ?? 0;
  const totalRutinas = rutinasVencer?.length ?? 0;
  const totalPendientes = turnosSinCobro.length;

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
            timeZone: "America/Argentina/Buenos_Aires",
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        <StatCard
          icon={<Calendar className="w-5 h-5 text-[#0EA5E9]" />}
          titulo="Turnos hoy"
          valor={totalTurnos}
          subtitulo="Kinesiología"
          iconBg="bg-[#F0F9FF]"
        />
        <StatCard
          icon={<Dumbbell className="w-5 h-5 text-[#8B5CF6]" />}
          titulo="Gym hoy"
          valor={totalGym}
          subtitulo="Pacientes esperados"
          iconBg="bg-[#F5F3FF]"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5 text-[#F59E0B]" />}
          titulo="Rutinas por vencer"
          valor={totalRutinas}
          subtitulo="Próximos 7 días"
          iconBg="bg-[#FFFBEB]"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-[#10B981]" />}
          titulo="Cobros pendientes"
          valor={totalPendientes}
          subtitulo="Turnos sin cobrar"
          iconBg="bg-[#ECFDF5]"
        />
      </div>

      {/* Secciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Turnos de hoy */}
        <SectionCard titulo="Turnos de hoy" enlace="/kine/agenda" accent="#0EA5E9">
          {!turnosHoy || turnosHoy.length === 0 ? (
            <EmptyState mensaje="Sin turnos agendados para hoy" />
          ) : (
            <ul className="space-y-2">
              {turnosHoy.map((t) => {
                const paciente = t.paciente as unknown as { nombre: string; dni: string } | null;
                return (
                  <li key={t.id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#64748B] w-11 shrink-0">
                      {String(t.hora_inicio).slice(0, 5)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{paciente?.nombre ?? "—"}</p>
                      <p className="text-xs text-[#94A3B8]">{ETIQUETAS_TRATAMIENTO[t.tipo_tratamiento] ?? t.tipo_tratamiento}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      t.estado === "PRESENTE" ? "bg-emerald-50 text-emerald-700" :
                      t.estado === "CONFIRMADO" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {t.estado === "PENDIENTE" ? "Pendiente" : t.estado === "CONFIRMADO" ? "Confirmado" : t.estado === "PRESENTE" ? "Presente" : t.estado}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Gym hoy */}
        <SectionCard titulo={`Clase de hoy — Gimnasio`} enlace="/gym/asistencias" accent="#8B5CF6">
          {!gymHoy || gymHoy.length === 0 ? (
            <EmptyState mensaje={`No hay miembros asignados para hoy (${diaNombre.charAt(0) + diaNombre.slice(1).toLowerCase()})`} />
          ) : (
            <ul className="space-y-2">
              {gymHoy.map((p) => (
                <li key={p.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#F5F3FF] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#8B5CF6]">{p.nombre.charAt(0)}</span>
                  </div>
                  <p className="text-sm font-medium text-[#0F172A] truncate">{p.nombre}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Rutinas por renovar */}
        <SectionCard titulo="Rutinas por renovar" enlace="/gym/rutinas" accent="#8B5CF6">
          {!rutinasVencer || rutinasVencer.length === 0 ? (
            <EmptyState mensaje="Sin rutinas por vencer esta semana" />
          ) : (
            <ul className="space-y-2">
              {rutinasVencer.map((r) => {
                const paciente = r.paciente as unknown as { nombre: string } | null;
                const vence = new Date(r.fecha_vencimiento + "T12:00:00");
                const diasRestantes = Math.ceil((vence.getTime() - new Date(today + "T12:00:00").getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{paciente?.nombre ?? "—"}</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      diasRestantes <= 2 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                    }`}>
                      {diasRestantes === 0 ? "Vence hoy" : diasRestantes === 1 ? "Vence mañana" : `${diasRestantes} días`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>

        {/* Cobros pendientes */}
        <SectionCard titulo="Cobros pendientes" enlace="/kine/cobranza" accent="#0EA5E9">
          {turnosSinCobro.length === 0 ? (
            <EmptyState mensaje="Sin cobros pendientes" />
          ) : (
            <ul className="space-y-2">
              {turnosSinCobro.slice(0, 6).map((t) => {
                const paciente = t.paciente as unknown as { nombre: string } | null;
                return (
                  <li key={t.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{paciente?.nombre ?? "—"}</p>
                      <p className="text-xs text-[#94A3B8]">{t.fecha} · {String(t.hora_inicio).slice(0, 5)}</p>
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600 shrink-0">Sin cobrar</span>
                  </li>
                );
              })}
              {turnosSinCobro.length > 6 && (
                <li className="text-xs text-[#94A3B8] text-center pt-1">
                  +{turnosSinCobro.length - 6} más →
                </li>
              )}
            </ul>
          )}
        </SectionCard>

      </div>
    </div>
  );
}

function StatCard({ icon, titulo, valor, subtitulo, iconBg }: {
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

function SectionCard({ titulo, enlace, accent, children }: {
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
