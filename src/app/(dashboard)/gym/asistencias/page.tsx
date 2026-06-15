"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

type PacienteGym = {
  id: string;
  nombre: string;
  dias_asignados: string[];
  fecha_inicio: string;
};

type Asistencia = {
  id: string;
  paciente_gym_id: string;
  fecha: string;
  estado: string;
  semana_ciclo: number;
};

const DIA_SEMANA_MAP: Record<number, string> = {
  0: "DOMINGO", 1: "LUNES", 2: "MARTES", 3: "MIERCOLES",
  4: "JUEVES", 5: "VIERNES", 6: "SABADO",
};

const ESTADOS = [
  { v: "PRESENTE", label: "Presente", color: "bg-emerald-600", icon: CheckCircle2 },
  { v: "AUSENTE", label: "Ausente", color: "bg-red-500", icon: XCircle },
  { v: "TARDE", label: "Tarde", color: "bg-amber-500", icon: Clock },
  { v: "JUSTIFICO", label: "Justificó", color: "bg-blue-500", icon: AlertCircle },
] as const;

const ESTADO_COLORS: Record<string, string> = {
  PRESENTE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  AUSENTE: "bg-red-50 text-red-700 border-red-200",
  TARDE: "bg-amber-50 text-amber-700 border-amber-200",
  JUSTIFICO: "bg-blue-50 text-blue-700 border-blue-200",
};

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calcSemanaCiclo(fechaInicio: string): number {
  const inicio = new Date(fechaInicio + "T00:00:00");
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(Math.floor(dias / 7) + 1, 1), 4);
}

export default function AsistenciasPage() {
  const [fecha, setFecha] = useState(fmt(new Date()));
  const [pacientes, setPacientes] = useState<PacienteGym[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const diaSemana = DIA_SEMANA_MAP[new Date(fecha + "T12:00:00").getDay()];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch("/api/gym/pacientes?estado=ACTIVO"),
        fetch(`/api/gym/asistencias?fecha=${fecha}`),
      ]);
      const [p, a] = await Promise.all([pRes.json(), aRes.json()]);
      setPacientes(Array.isArray(p) ? p : []);
      setAsistencias(Array.isArray(a) ? a : []);
    } catch { setPacientes([]); setAsistencias([]); }
    finally { setLoading(false); }
  }, [fecha]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const pacientesHoy = pacientes.filter((p) =>
    p.dias_asignados?.includes(diaSemana)
  );

  const asistenciaMap = Object.fromEntries(asistencias.map((a) => [a.paciente_gym_id, a]));

  async function marcarAsistencia(pacienteId: string, estado: string, fechaInicio: string) {
    setSaving(pacienteId);
    try {
      await fetch("/api/gym/asistencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pacienteGymId: pacienteId,
          fecha,
          estado,
          semanaCiclo: calcSemanaCiclo(fechaInicio),
        }),
      });
      setAsistencias((prev) => {
        const existing = prev.find((a) => a.paciente_gym_id === pacienteId);
        if (existing) {
          return prev.map((a) => a.paciente_gym_id === pacienteId ? { ...a, estado } : a);
        }
        return [...prev, { id: Date.now().toString(), paciente_gym_id: pacienteId, fecha, estado, semana_ciclo: calcSemanaCiclo(fechaInicio) }];
      });
    } finally {
      setSaving(null);
    }
  }

  function navFecha(dias: number) {
    const d = new Date(fecha + "T12:00:00");
    d.setDate(d.getDate() + dias);
    setFecha(fmt(d));
  }

  const fechaDisplay = new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

  const resumen = {
    presente: asistencias.filter((a) => a.estado === "PRESENTE").length,
    ausente: asistencias.filter((a) => a.estado === "AUSENTE").length,
    tarde: asistencias.filter((a) => a.estado === "TARDE").length,
    justifico: asistencias.filter((a) => a.estado === "JUSTIFICO").length,
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asistencias</h1>
          <p className="text-gray-500 text-sm mt-0.5 capitalize">{fechaDisplay}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navFecha(-1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} />
          </button>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button onClick={() => navFecha(1)} className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Resumen */}
      {asistencias.length > 0 && (
        <div className="flex gap-3 mb-5">
          {[
            { key: "presente", label: "Presente", color: "text-emerald-600" },
            { key: "ausente", label: "Ausente", color: "text-red-500" },
            { key: "tarde", label: "Tarde", color: "text-amber-500" },
            { key: "justifico", label: "Justificó", color: "text-blue-500" },
          ].map((s) => resumen[s.key as keyof typeof resumen] > 0 ? (
            <div key={s.key} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-2 text-center">
              <span className={`text-xl font-bold ${s.color}`}>{resumen[s.key as keyof typeof resumen]}</span>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ) : null)}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">Cargando...</div>
      ) : pacientesHoy.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-500 font-medium">Sin miembros asignados para este día</p>
          <p className="text-gray-400 text-sm mt-1">{diaSemana.charAt(0) + diaSemana.slice(1).toLowerCase()}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pacientesHoy.map((p) => {
            const asist = asistenciaMap[p.id];
            return (
              <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${
                asist ? `${ESTADO_COLORS[asist.estado]} border` : "border-gray-100"
              }`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Semana {calcSemanaCiclo(p.fecha_inicio)} de ciclo</p>
                  </div>
                  <div className="flex gap-1.5">
                    {ESTADOS.map((est) => {
                      const isActive = asist?.estado === est.v;
                      return (
                        <button
                          key={est.v}
                          disabled={saving === p.id}
                          onClick={() => marcarAsistencia(p.id, est.v, p.fecha_inicio)}
                          title={est.label}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                            isActive
                              ? `${est.color} text-white border-transparent`
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          } disabled:opacity-50`}
                        >
                          {est.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
