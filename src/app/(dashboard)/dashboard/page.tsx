import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { Calendar, Dumbbell, AlertTriangle, DollarSign } from "lucide-react";
import Link from "next/link";
import { AgendaDelDia, type TurnoHoy } from "@/components/dashboard/agenda-del-dia";

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
      .select("id, hora_inicio, hora_fin, tipo_tratamiento, estado, usa_botas, notas, paciente:pacientes(id, nombre, dni)")
      .eq("fecha", today)
      .not("estado", "in", "(CANCELADO)")
      .order("hora_inicio", { ascending: true }),

    supabase
      .from("pacientes")
      .select("id")
      .eq("activo_gym", true)
      .eq("estado_gym", "ACTIVO")
      .contains("dias_asignados", [diaNombre]),

    supabase
      .from("rutinas")
      .select("id, fecha_inicio, fecha_vencimiento, paciente:pacientes(id, nombre)")
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

  const totalTurnos    = turnosHoy?.length ?? 0;
  const totalGym       = gymHoy?.length ?? 0;
  const totalRutinas   = rutinasVencer?.length ?? 0;
  const totalPendientes = turnosSinCobro.length;

  const turnosParaAgenda: TurnoHoy[] = (turnosHoy ?? []).map((t) => ({
    id: t.id,
    hora_inicio: String(t.hora_inicio),
    hora_fin: String(t.hora_fin),
    tipo_tratamiento: t.tipo_tratamiento,
    estado: t.estado,
    usa_botas: t.usa_botas,
    notas: t.notas ?? null,
    paciente: t.paciente as unknown as { id: string; nombre: string; dni: string } | null,
  }));

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header saludo */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#0F172A]">
          Hola, {session?.nombre?.split(" ")[0]} 👋
        </h1>
        <p className="text-[#64748B] text-sm mt-1 capitalize">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "America/Argentina/Buenos_Aires",
          })}
        </p>
      </div>

      {/* 1. Agenda del día — protagonista */}
      <div className="mb-4">
        <AgendaDelDia turnos={turnosParaAgenda} today={today} />
      </div>

      {/* 2. Rutinas a renovar */}
      {rutinasVencer && rutinasVencer.length > 0 && (
        <div className="mb-4">
          <RutinasARenovar rutinas={rutinasVencer} today={today} />
        </div>
      )}

      {/* 3. Métricas compactas */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <MetricaMini icon={<Calendar className="w-4 h-4 text-[#0EA5E9]" />} valor={totalTurnos}    label="Turnos" />
        <MetricaMini icon={<Dumbbell className="w-4 h-4 text-[#8B5CF6]" />} valor={totalGym}       label="Gym" />
        <MetricaMini icon={<AlertTriangle className="w-4 h-4 text-[#F59E0B]" />} valor={totalRutinas} label="Rutinas" />
        <MetricaMini icon={<DollarSign className="w-4 h-4 text-[#10B981]" />} valor={totalPendientes} label="Cobros" />
      </div>

      {/* 4. Cobros pendientes */}
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
          <h2 className="font-bold text-[#0F172A] text-base">💰 Cobros pendientes</h2>
          <Link href="/kine/cobranza" className="text-xs font-medium text-[#0EA5E9]">
            Ver todo →
          </Link>
        </div>
        {turnosSinCobro.length === 0 ? (
          <div className="p-5 text-center">
            <p className="text-sm text-emerald-600">✓ Sin cobros pendientes</p>
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {turnosSinCobro.slice(0, 3).map((t) => {
              const pac = t.paciente as unknown as { nombre: string } | null;
              return (
                <div key={t.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{pac?.nombre ?? "—"}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {t.fecha} · {String(t.hora_inicio).slice(0, 5)}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-red-50 text-red-600 shrink-0">
                    Sin cobrar
                  </span>
                </div>
              );
            })}
            {turnosSinCobro.length > 3 && (
              <Link
                href="/kine/cobranza"
                className="block text-center text-xs text-[#0EA5E9] font-medium pt-2 pb-1"
              >
                +{turnosSinCobro.length - 3} más → Ver todo
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

type RutinaConFechas = {
  id: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  paciente: unknown;
};

function RutinasARenovar({ rutinas, today }: { rutinas: RutinaConFechas[]; today: string }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
        <h2 className="font-bold text-[#0F172A] text-base">🏋️ Rutinas a renovar</h2>
        <Link href="/gym/rutinas" className="text-xs font-medium text-[#8B5CF6]">
          Ver todo →
        </Link>
      </div>
      <div className="p-3 flex flex-col gap-2">
        {rutinas.map((r) => {
          const pac = r.paciente as { nombre: string } | null;
          const venc = new Date(r.fecha_vencimiento + "T23:59:59");
          const hoyDt = new Date(today + "T12:00:00");
          const dias = Math.ceil((venc.getTime() - hoyDt.getTime()) / (1000 * 60 * 60 * 24));
          const inicioRutina = new Date(r.fecha_inicio + "T00:00:00");
          const semana = Math.min(Math.max(Math.floor((hoyDt.getTime() - inicioRutina.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1, 1), 4);

          const urgencia =
            dias <= 2
              ? { franja: "#EF4444", fondo: "#FEE2E2", texto: "#DC2626" }
              : dias <= 5
              ? { franja: "#F59E0B", fondo: "#FEF3C7", texto: "#D97706" }
              : { franja: "#EAB308", fondo: "#FEF9C3", texto: "#A16207" };

          const labelDias =
            dias <= 0
              ? "⚠️ Vencida"
              : dias === 1
              ? "⚠️ Vence mañana"
              : `⚠️ Vence en ${dias} días`;

          return (
            <div
              key={r.id}
              className="flex rounded-[10px] overflow-hidden"
              style={{ minHeight: "56px", border: `1px solid ${urgencia.franja}30` }}
            >
              <div style={{ width: 6, backgroundColor: urgencia.franja, flexShrink: 0 }} />
              <div
                className="flex-1 px-3 py-2 flex items-center justify-between gap-2"
                style={{ backgroundColor: urgencia.fondo }}
              >
                <div>
                  <p className="font-semibold text-[#1E293B] text-sm">🏋️ {pac?.nombre ?? "—"}</p>
                  <p className="text-xs text-[#64748B] mt-0.5">Semana {semana} de 4</p>
                </div>
                <span
                  className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0 bg-white"
                  style={{ color: urgencia.texto }}
                >
                  {labelDias}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricaMini({ icon, valor, label }: { icon: React.ReactNode; valor: number; label: string }) {
  return (
    <div className="bg-white rounded-[12px] border border-[#E2E8F0] p-2.5 text-center shadow-sm">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xl font-bold text-[#0F172A] leading-none">{valor}</p>
      <p className="text-[10px] text-[#94A3B8] mt-1">{label}</p>
    </div>
  );
}
