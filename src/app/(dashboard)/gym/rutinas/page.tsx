"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Plus, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { RutinaEditor } from "@/components/gym/rutina-editor";

const RutinaPrintBtn = dynamic(
  () => import("@/components/gym/rutina-print-btn"),
  { ssr: false }
);

type EjercicioRutina = {
  id: string;
  ejercicio_id: string | null;
  nombre_libre: string | null;
  etapa: string;
  orden: number;
  series_s1: number | null; reps_s1: number | null;
  series_s2: number | null; reps_s2: number | null;
  series_s3: number | null; reps_s3: number | null;
  series_s4: number | null; reps_s4: number | null;
  notas: string | null;
  ejercicio: { id: string; nombre: string; grupo_muscular: string | null; nivel: string; imagen_url: string | null } | null;
};

type Rutina = {
  id: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: string;
  paciente: { id: string; nombre: string; dias_asignados: string[] };
  ejercicios: EjercicioRutina[];
};

const ETAPA_LABELS: Record<string, string> = {
  ENTRADA_CALOR: "Entrada en calor",
  PRIMERA_ETAPA: "1ª Etapa",
  SEGUNDA_ETAPA: "2ª Etapa",
  TERCERA_ETAPA: "3ª Etapa",
  TRABAJO_FINAL: "Trabajo final",
};

const ETAPA_COLORS: Record<string, string> = {
  ENTRADA_CALOR: "bg-amber-50 text-amber-700 border-amber-100",
  PRIMERA_ETAPA: "bg-blue-50 text-blue-700 border-blue-100",
  SEGUNDA_ETAPA: "bg-indigo-50 text-indigo-700 border-indigo-100",
  TERCERA_ETAPA: "bg-purple-50 text-purple-700 border-purple-100",
  TRABAJO_FINAL: "bg-rose-50 text-rose-700 border-rose-100",
};

function diasRestantes(fechaVencimiento: string): number {
  const hoy = new Date();
  const venc = new Date(fechaVencimiento + "T23:59:59");
  return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function semanaCicloActual(fechaInicio: string): number {
  const inicio = new Date(fechaInicio + "T00:00:00");
  const hoy = new Date();
  const dias = Math.floor((hoy.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
  return Math.min(Math.max(Math.floor(dias / 7) + 1, 1), 4);
}

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("ACTIVA");
  const [expandida, setExpandida] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [rutinaEdit, setRutinaEdit] = useState<Rutina | null>(null);
  const [profesional, setProfesional] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d?.usuario?.nombre) setProfesional(d.usuario.nombre); })
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstado) params.set("estado", filtroEstado);
      const res = await fetch(`/api/gym/rutinas?${params}`);
      setRutinas(await res.json());
    } catch { setRutinas([]); }
    finally { setLoading(false); }
  }, [filtroEstado]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleEliminar(id: string) {
    if (!confirm("¿Eliminar esta rutina?")) return;
    await fetch(`/api/gym/rutinas/${id}`, { method: "DELETE" });
    fetchData();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rutinas</h1>
          <p className="text-gray-500 text-sm mt-0.5">Ciclos de 4 semanas por miembro</p>
        </div>
        <button onClick={() => { setRutinaEdit(null); setEditorOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus size={16} /> Nueva rutina
        </button>
      </div>

      <div className="flex gap-1 mb-5">
        {[{ v: "ACTIVA", label: "Activas" }, { v: "VENCIDA", label: "Vencidas" }, { v: "", label: "Todas" }].map((f) => (
          <button key={f.v} onClick={() => setFiltroEstado(f.v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              filtroEstado === f.v ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">Cargando...</div>
      ) : rutinas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Calendar size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hay rutinas {filtroEstado === "ACTIVA" ? "activas" : filtroEstado === "VENCIDA" ? "vencidas" : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rutinas.map((r) => {
            const dias = diasRestantes(r.fecha_vencimiento);
            const semana = semanaCicloActual(r.fecha_inicio);
            const vencePronto = r.estado === "ACTIVA" && dias <= 7 && dias >= 0;
            const vencida = r.estado === "VENCIDA" || dias < 0;
            const isExpanded = expandida === r.id;

            return (
              <div key={r.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                vencePronto ? "border-amber-200" : vencida ? "border-gray-200" : "border-gray-100"
              }`}>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <button className="flex-1 text-left" onClick={() => setExpandida(isExpanded ? null : r.id)}>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{r.paciente?.nombre}</span>
                            {vencePronto && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                <AlertCircle size={10} /> Vence en {dias}d
                              </span>
                            )}
                            {vencida && (
                              <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Vencida</span>
                            )}
                            {r.estado === "ACTIVA" && !vencePronto && (
                              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 size={10} /> Sem {semana}/4
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {r.fecha_inicio.split("-").reverse().join("/")} → {r.fecha_vencimiento.split("-").reverse().join("/")}
                            <span className="ml-2 text-gray-400">{r.ejercicios?.length ?? 0} ejercicios</span>
                          </p>
                        </div>
                      </div>
                    </button>
                    <div className="flex gap-2 shrink-0">
                      <RutinaPrintBtn rutina={r} profesional={profesional} />
                      <button onClick={() => { setRutinaEdit(r); setEditorOpen(true); }}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(r.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium border border-red-100 text-red-500 hover:bg-red-50 transition-colors">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && r.ejercicios?.length > 0 && (
                  <div className="border-t border-gray-100 p-4">
                    {["ENTRADA_CALOR","PRIMERA_ETAPA","SEGUNDA_ETAPA","TERCERA_ETAPA","TRABAJO_FINAL"].map((etapa) => {
                      const items = r.ejercicios.filter((e) => e.etapa === etapa).sort((a, b) => a.orden - b.orden);
                      if (!items.length) return null;
                      return (
                        <div key={etapa} className="mb-4 last:mb-0">
                          <h3 className={`text-xs font-semibold px-2 py-1 rounded-lg border inline-block mb-2 ${ETAPA_COLORS[etapa]}`}>
                            {ETAPA_LABELS[etapa]}
                          </h3>
                          <div className="space-y-2">
                            {items.map((ej) => {
                              const nombre = ej.ejercicio?.nombre ?? ej.nombre_libre ?? "Ejercicio";
                              return (
                                <div key={ej.id} className="flex items-start gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                                  <span className="text-sm font-medium text-gray-900 flex-1">{nombre}</span>
                                  <div className="flex gap-2 text-xs text-gray-500 shrink-0">
                                    {[1, 2, 3, 4].map((s) => {
                                      const series = ej[`series_s${s}` as keyof EjercicioRutina] as number | null;
                                      const reps = ej[`reps_s${s}` as keyof EjercicioRutina] as number | null;
                                      if (!series && !reps) return null;
                                      return (
                                        <span key={s} className="bg-white border border-gray-200 px-1.5 py-0.5 rounded-lg">
                                          S{s}: {series ?? "?"}×{reps ?? "?"}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RutinaEditor
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setRutinaEdit(null); }}
        onSuccess={() => { fetchData(); setEditorOpen(false); setRutinaEdit(null); }}
        rutina={rutinaEdit}
      />
    </div>
  );
}
