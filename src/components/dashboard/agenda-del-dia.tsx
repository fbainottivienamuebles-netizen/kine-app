"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, CheckCheck, Pencil, DollarSign } from "lucide-react";

export type TurnoHoy = {
  id: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_tratamiento: string;
  estado: string;
  usa_botas: boolean;
  notas: string | null;
  paciente: { id: string; nombre: string; dni: string } | null;
};

type TurnoStatus = "EN_CURSO" | "MUY_PRONTO" | "PROXIMAMENTE" | "RESTO_DIA" | "PASADO";

const COLORES: Record<string, { franja: string; fondo: string; emoji: string; label: string }> = {
  MASAJES:           { franja: "#3B82F6", fondo: "#DBEAFE", emoji: "💆", label: "Masajes" },
  REHABILITACION:    { franja: "#059669", fondo: "#D1FAE5", emoji: "🦿", label: "Rehabilitación" },
  DRENAJE_LINFATICO: { franja: "#8B5CF6", fondo: "#F3E8FF", emoji: "💜", label: "Drenaje linfático" },
  DRENAJE_BOTAS:     { franja: "#6D28D9", fondo: "#EDE9FE", emoji: "🩻", label: "Drenaje + Botas" },
  HIPOPRESIVOS:      { franja: "#D97706", fondo: "#FEF3C7", emoji: "🧘", label: "Hipopresivos" },
  DRENAJE_KINE:      { franja: "#14B8A6", fondo: "#CCFBF1", emoji: "🔀", label: "Drenaje + Kine" },
};

const ESTADO_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PENDIENTE:  { label: "Pendiente",  bg: "#FEF3C7", color: "#D97706" },
  CONFIRMADO: { label: "Confirmado", bg: "#DBEAFE", color: "#1D4ED8" },
  PRESENTE:   { label: "Presente",   bg: "#D1FAE5", color: "#059669" },
  AUSENTE:    { label: "Ausente",    bg: "#FEE2E2", color: "#DC2626" },
};

function getStatus(horaInicio: string, horaFin: string, today: string, now: Date): TurnoStatus {
  const start = new Date(`${today}T${horaInicio}`);
  const end   = new Date(`${today}T${horaFin}`);
  const mins  = (start.getTime() - now.getTime()) / 60000;
  if (now >= start && now <= end) return "EN_CURSO";
  if (mins > 0 && mins <= 60)    return "MUY_PRONTO";
  if (mins > 60 && mins <= 120)  return "PROXIMAMENTE";
  if (mins > 120)                return "RESTO_DIA";
  return "PASADO";
}

function fmtMin(min: number): string {
  const m = Math.round(Math.abs(min));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}min` : `${h}h`;
}

function TurnoCard({
  turno,
  status,
  today,
  now,
  onTap,
}: {
  turno: TurnoHoy;
  status: TurnoStatus;
  today: string;
  now: Date;
  onTap: () => void;
}) {
  const col = COLORES[turno.tipo_tratamiento] ?? COLORES.MASAJES;
  const isPasado     = status === "PASADO";
  const isEnCurso    = status === "EN_CURSO";
  const isMuyPronto  = status === "MUY_PRONTO";
  const isProximo    = status === "PROXIMAMENTE";
  const isResto      = status === "RESTO_DIA";

  const frameColor = isPasado ? "#94A3B8" : col.franja;
  const bgColor    = isPasado ? "#F1F5F9" : col.fondo;
  const panelWidth = isEnCurso ? 72 : 64;

  const start    = new Date(`${today}T${turno.hora_inicio}`);
  const minsHasta = (start.getTime() - now.getTime()) / 60000;

  const horaPartes = turno.hora_inicio.slice(0, 5).split(":");
  const badge      = ESTADO_BADGE[turno.estado] ?? { label: turno.estado, bg: "#F1F5F9", color: "#64748B" };

  return (
    <button
      onClick={onTap}
      className="w-full text-left rounded-[12px] overflow-hidden active:scale-[0.99] transition-transform"
      style={{
        minHeight: "72px",
        opacity: isResto ? 0.65 : 1,
        border: isEnCurso ? `2px solid ${col.franja}` : "1px solid transparent",
        boxShadow: isEnCurso ? `0 0 0 3px ${col.franja}30` : undefined,
      }}
    >
      <div className="flex" style={{ minHeight: "72px" }}>
        {/* Left time panel */}
        <div
          className="flex flex-col items-center justify-center shrink-0"
          style={{ width: panelWidth, backgroundColor: frameColor }}
        >
          <span className="text-white font-bold leading-none" style={{ fontSize: 20 }}>
            {horaPartes[0]}
          </span>
          <span className="text-white/75 font-medium" style={{ fontSize: 13 }}>
            :{horaPartes[1]}
          </span>
        </div>

        {/* Right body */}
        <div
          className="flex-1 px-3 py-2 flex flex-col justify-center gap-1"
          style={{ backgroundColor: bgColor }}
        >
          {/* Row 1: name + badges */}
          <div className="flex items-start justify-between gap-2">
            <span
              className="font-bold text-[#1E293B] leading-tight"
              style={{ fontSize: 16 }}
            >
              {turno.paciente?.nombre ?? "—"}
            </span>
            <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
              {isEnCurso && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                  style={{ backgroundColor: "#FEE2E2", color: "#EF4444" }}
                >
                  ● EN CURSO
                </span>
              )}
              {isMuyPronto && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#FEF3C7", color: "#F59E0B" }}
                >
                  ⚡ En {fmtMin(minsHasta)}
                </span>
              )}
              {isProximo && (
                <span
                  className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "#FEF9C3", color: "#D97706" }}
                >
                  🕐 En {fmtMin(minsHasta)}
                </span>
              )}
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: badge.bg, color: badge.color }}
              >
                {badge.label}
              </span>
            </div>
          </div>

          {/* Row 2: treatment + botas */}
          <div className="flex items-center gap-1.5">
            <span
              style={{ fontSize: 13, color: isPasado ? "#94A3B8" : "#64748B" }}
            >
              {col.emoji} {col.label}
            </span>
            {turno.usa_botas && (
              <span style={{ fontSize: 13 }}>🥾</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function TurnoDetalle({
  turno,
  loading,
  onClose,
  onMarcarPresente,
}: {
  turno: TurnoHoy;
  loading: boolean;
  onClose: () => void;
  onMarcarPresente: () => void;
}) {
  const col   = COLORES[turno.tipo_tratamiento] ?? COLORES.MASAJES;
  const badge = ESTADO_BADGE[turno.estado] ?? { label: turno.estado, bg: "#F1F5F9", color: "#64748B" };
  const yaPresente = turno.estado === "PRESENTE";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[24px] bg-white overflow-hidden max-h-[85dvh] overflow-y-auto shadow-2xl">
        {/* Header colorido */}
        <div className="px-5 pt-5 pb-4 relative" style={{ backgroundColor: col.franja }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <p className="text-white font-bold" style={{ fontSize: 22 }}>
            {turno.hora_inicio.slice(0, 5)}
          </p>
          <p className="text-white/80 text-sm mt-0.5">
            {col.emoji} {col.label}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-5 space-y-4">
          {/* Nombre */}
          <div>
            <p className="text-[#1E293B] font-bold" style={{ fontSize: 24 }}>
              {turno.paciente?.nombre ?? "—"}
            </p>
            {turno.paciente?.dni && (
              <p className="text-[#64748B] text-sm mt-0.5">DNI {turno.paciente.dni}</p>
            )}
          </div>

          {/* Badges de estado y botas */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="px-3 py-1 rounded-full font-semibold text-sm"
              style={{ backgroundColor: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
            {turno.usa_botas && (
              <span
                className="px-3 py-1 rounded-full font-semibold text-sm"
                style={{ backgroundColor: "#EDE9FE", color: "#6D28D9" }}
              >
                🥾 Con botas de compresión
              </span>
            )}
          </div>

          {/* Notas */}
          {turno.notas && (
            <div className="bg-[#F8FAFC] rounded-[12px] p-3">
              <p className="text-[#1E293B] text-sm leading-relaxed">📝 {turno.notas}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-1">
            {!yaPresente && (
              <button
                onClick={onMarcarPresente}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 rounded-[12px] font-semibold text-white disabled:opacity-60"
                style={{ height: 52, backgroundColor: "#10B981" }}
              >
                <CheckCheck className="w-4 h-4" />
                {loading ? "Guardando…" : "Presente"}
              </button>
            )}
            <Link
              href="/kine/agenda"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 rounded-[12px] font-semibold text-[#1E293B]"
              style={{ height: 52, backgroundColor: "#F1F5F9" }}
            >
              <Pencil className="w-4 h-4" />
              Editar
            </Link>
            <Link
              href="/kine/cobranza"
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 rounded-[12px] font-semibold text-white"
              style={{ height: 52, backgroundColor: "#0EA5E9" }}
            >
              <DollarSign className="w-4 h-4" />
              Cobro
            </Link>
          </div>
        </div>

        {/* Safe area bottom */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </>
  );
}

export function AgendaDelDia({ turnos, today }: { turnos: TurnoHoy[]; today: string }) {
  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState<TurnoHoy | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [localEstados, setLocalEstados] = useState<Record<string, string>>({});

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  async function marcarPresente(turno: TurnoHoy) {
    setLoadingId(turno.id);
    try {
      const res = await fetch(`/api/kine/turnos/${turno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "PRESENTE" }),
      });
      if (res.ok) {
        setLocalEstados((prev) => ({ ...prev, [turno.id]: "PRESENTE" }));
      }
    } finally {
      setLoadingId(null);
    }
  }

  function getEstado(id: string, original: string) {
    return localEstados[id] ?? original;
  }

  const withStatus = turnos.map((t) => ({
    ...t,
    estado: getEstado(t.id, t.estado),
    status: getStatus(t.hora_inicio, t.hora_fin, today, now),
  }));

  const zona1 = withStatus
    .filter((t) => ["EN_CURSO", "MUY_PRONTO", "PROXIMAMENTE"].includes(t.status))
    .sort((a, b) => {
      const ord: Record<string, number> = { EN_CURSO: 0, MUY_PRONTO: 1, PROXIMAMENTE: 2 };
      return (ord[a.status] ?? 9) - (ord[b.status] ?? 9);
    });

  const zona2 = withStatus.filter((t) => ["RESTO_DIA", "PASADO"].includes(t.status));

  const selectedConEstado = selected
    ? { ...selected, estado: getEstado(selected.id, selected.estado) }
    : null;

  return (
    <>
      <div className="bg-white rounded-[16px] border border-[#E2E8F0] shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
          <h2 className="font-bold text-[#0F172A] text-base">🗓️ Agenda del día</h2>
          <Link href="/kine/agenda" className="text-xs font-medium text-[#0EA5E9]">
            Ver todo →
          </Link>
        </div>

        {turnos.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-[#94A3B8]">Sin turnos agendados para hoy</p>
          </div>
        ) : (
          <>
            {/* Zona 1 — Ahora y próximas 2h */}
            <div className="p-3 border-b border-[#F1F5F9]">
              <p className="text-xs font-bold text-orange-500 mb-2 px-1">⚡ Ahora y próximas 2 horas</p>
              {zona1.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {zona1.map((t) => (
                    <TurnoCard
                      key={t.id}
                      turno={t}
                      status={t.status}
                      today={today}
                      now={now}
                      onTap={() => setSelected(t)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-emerald-600 text-center py-2">
                  ✓ Sin turnos en las próximas 2 horas
                </p>
              )}
            </div>

            {/* Zona 2 — Más tarde hoy */}
            {zona2.length > 0 && (
              <div className="p-3">
                <p className="text-xs font-medium text-[#94A3B8] mb-2 px-1">📅 Más tarde hoy</p>
                <div className="flex flex-col gap-2">
                  {zona2.map((t) => (
                    <TurnoCard
                      key={t.id}
                      turno={t}
                      status={t.status}
                      today={today}
                      now={now}
                      onTap={() => setSelected(t)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom sheet detalle */}
      {selectedConEstado && (
        <TurnoDetalle
          turno={selectedConEstado}
          loading={loadingId === selectedConEstado.id}
          onClose={() => setSelected(null)}
          onMarcarPresente={() => marcarPresente(selectedConEstado)}
        />
      )}
    </>
  );
}
