"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2, Shuffle, RefreshCw, Check } from "lucide-react";

type BibEjercicio = {
  id: string;
  nombre: string;
  grupo_muscular: string | null;
  imagen_url: string | null;
  niveles: string[] | null;
  etapas: string[] | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pacienteId: string;
  pacienteNombre: string;
  fechaInicio: string;
};

const ETAPAS = [
  { value: "ENTRADA_CALOR", label: "Entrada en calor", emoji: "🔥", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-800" },
  { value: "PRIMERA_ETAPA", label: "1ª Etapa", emoji: "1️⃣", border: "border-blue-200", bg: "bg-blue-50", text: "text-blue-800" },
  { value: "SEGUNDA_ETAPA", label: "2ª Etapa", emoji: "2️⃣", border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-800" },
  { value: "TERCERA_ETAPA", label: "3ª Etapa", emoji: "3️⃣", border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-800" },
  { value: "TRABAJO_FINAL", label: "Trabajo final", emoji: "🧘", border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-800" },
] as const;

const NIVEL_BADGE: Record<string, { label: string; color: string }> = {
  basico: { label: "Básico", color: "bg-emerald-100 text-emerald-700" },
  intermedio: { label: "Intermedio", color: "bg-amber-100 text-amber-700" },
  avanzado: { label: "Avanzado", color: "bg-red-100 text-red-700" },
};

const NIVELES_PERMITIDOS: Record<string, string[]> = {
  basico: ["basico"],
  intermedio: ["basico", "intermedio"],
  avanzado: ["basico", "intermedio", "avanzado"],
};

const ETAPA_LABELS_LOWER: Record<string, string> = {
  ENTRADA_CALOR: "entrada en calor",
  PRIMERA_ETAPA: "1ª etapa",
  SEGUNDA_ETAPA: "2ª etapa",
  TERCERA_ETAPA: "3ª etapa",
  TRABAJO_FINAL: "trabajo final",
};

const DEFAULT_SR = [
  { series: 4, reps: 8 },
  { series: 4, reps: 6 },
  { series: 3, reps: 8 },
  { series: 4, reps: 8 },
];

export function SugerirRutinaModal({ isOpen, onClose, onSuccess, pacienteId, pacienteNombre, fechaInicio }: Props) {
  const [sugerencia, setSugerencia] = useState<Record<string, BibEjercicio[]>>({});
  const [avisos, setAvisos] = useState<string[]>([]);
  const [nivelPaciente, setNivelPaciente] = useState("basico");
  const [biblioteca, setBiblioteca] = useState<BibEjercicio[]>([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [etapaRegenerando, setEtapaRegenerando] = useState<string | null>(null);
  const [reemplazando, setReemplazando] = useState<{ etapa: string; index: number } | null>(null);
  const [error, setError] = useState("");

  const cargarSugerencia = useCallback(async () => {
    setCargando(true);
    setError("");
    setReemplazando(null);
    try {
      const res = await fetch("/api/gym/rutinas/sugerir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacienteId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al generar sugerencia"); return; }
      setSugerencia(data.rutina ?? {});
      setAvisos(data.avisos ?? []);
      setNivelPaciente(data.nivelPaciente ?? "basico");
      if (data.biblioteca) setBiblioteca(data.biblioteca);
    } catch {
      setError("Error de conexión");
    } finally {
      setCargando(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    if (isOpen && pacienteId) cargarSugerencia();
  }, [isOpen, pacienteId, cargarSugerencia]);

  useEffect(() => {
    if (!isOpen) { setSugerencia({}); setAvisos([]); setReemplazando(null); setError(""); }
  }, [isOpen]);

  async function regenerarEtapa(etapa: string) {
    setEtapaRegenerando(etapa);
    setReemplazando(null);
    try {
      const excluirIds = ETAPAS
        .filter((e) => e.value !== etapa)
        .flatMap((e) => (sugerencia[e.value] ?? []).map((ej) => ej.id));
      const [res] = await Promise.all([
        fetch("/api/gym/rutinas/sugerir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pacienteId, etapa, excluirIds }),
        }),
        new Promise<void>((r) => setTimeout(r, 1000)),
      ]);
      const data = await res.json();
      if (res.ok && data.rutina?.[etapa]) {
        setSugerencia((prev) => ({ ...prev, [etapa]: data.rutina[etapa] }));
        if (data.avisos?.length > 0) {
          setAvisos((prev) => [
            ...prev.filter((a) => !a.includes(ETAPA_LABELS_LOWER[etapa] ?? "")),
            ...data.avisos,
          ]);
        }
      }
    } catch {
      // silent
    } finally {
      setEtapaRegenerando(null);
    }
  }

  function getAlternativas(etapa: string, index: number): BibEjercicio[] {
    const nivelesPermitidos = NIVELES_PERMITIDOS[nivelPaciente] ?? ["basico"];
    const idsEnSugerencia = new Set(
      ETAPAS.flatMap((e) => (sugerencia[e.value] ?? []).map((ej) => ej.id))
    );
    return biblioteca.filter(
      (ej) =>
        !idsEnSugerencia.has(ej.id) &&
        Array.isArray(ej.etapas) &&
        ej.etapas.includes(etapa) &&
        Array.isArray(ej.niveles) &&
        ej.niveles.some((n) => nivelesPermitidos.includes(n))
    );
  }

  function reemplazarEjercicio(etapa: string, index: number, nuevo: BibEjercicio) {
    setSugerencia((prev) => {
      const items = [...(prev[etapa] ?? [])];
      items[index] = nuevo;
      return { ...prev, [etapa]: items };
    });
    setReemplazando(null);
  }

  async function confirmar() {
    setGuardando(true);
    setError("");
    try {
      const ejercicios = ETAPAS.flatMap((et) =>
        (sugerencia[et.value] ?? []).map((ej, orden) => ({
          ejercicioId: ej.id,
          nombreLibre: null,
          etapa: et.value,
          seriesS1: DEFAULT_SR[0].series, repsS1: DEFAULT_SR[0].reps,
          seriesS2: DEFAULT_SR[1].series, repsS2: DEFAULT_SR[1].reps,
          seriesS3: DEFAULT_SR[2].series, repsS3: DEFAULT_SR[2].reps,
          seriesS4: DEFAULT_SR[3].series, repsS4: DEFAULT_SR[3].reps,
          notas: null,
          orden,
        }))
      );
      const res = await fetch("/api/gym/rutinas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacienteGymId: pacienteId, fechaInicio, ejercicios }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      onSuccess();
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setGuardando(false);
    }
  }

  if (!isOpen) return null;

  const nivelBadge = NIVEL_BADGE[nivelPaciente];
  const tieneSugerencia = Object.keys(sugerencia).length > 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold text-gray-900">✨ Rutina sugerida</span>
              {nivelBadge && !cargando && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${nivelBadge.color}`}>
                  {nivelBadge.label}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{pacienteNombre}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cargando ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 size={28} className="animate-spin text-violet-500" />
              <p className="text-sm text-gray-500">Generando rutina personalizada...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>
              )}

              {avisos.map((aviso, i) => (
                <div key={i} className="flex gap-2.5 bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-xl border border-amber-200">
                  <span className="shrink-0">⚠️</span>
                  <span>{aviso}</span>
                </div>
              ))}

              {ETAPAS.map((et) => {
                const ejerciciosEtapa = sugerencia[et.value] ?? [];
                const isRegen = etapaRegenerando === et.value;

                return (
                  <div key={et.value} className={`rounded-xl border-2 ${et.border} ${et.bg}`}>
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <span className={`text-sm font-semibold ${et.text}`}>
                        {et.emoji} {et.label}
                        <span className="ml-1.5 font-normal opacity-60 text-xs">
                          {ejerciciosEtapa.length} ejercicio{ejerciciosEtapa.length !== 1 ? "s" : ""}
                        </span>
                      </span>
                      <button
                        onClick={() => regenerarEtapa(et.value)}
                        disabled={!!etapaRegenerando || guardando}
                        className={`p-1.5 rounded-lg hover:bg-black/10 transition-colors disabled:opacity-40 ${et.text}`}
                        title="Nueva sugerencia para esta etapa"
                      >
                        <Shuffle size={14} className={isRegen ? "animate-spin" : ""} />
                      </button>
                    </div>

                    <div className="px-3 pb-3 space-y-2">
                      {ejerciciosEtapa.length === 0 ? (
                        <div className="bg-white/60 rounded-lg px-3 py-2 text-xs text-gray-400">
                          Sin ejercicios disponibles para esta etapa y nivel
                        </div>
                      ) : (
                        ejerciciosEtapa.map((ej, idx) => {
                          const isReemplazandoEste = reemplazando?.etapa === et.value && reemplazando?.index === idx;
                          const firstNivel = ej.niveles?.[0];
                          const nBadge = firstNivel ? NIVEL_BADGE[firstNivel] : null;
                          const alternativas = isReemplazandoEste ? getAlternativas(et.value, idx) : [];

                          return (
                            <div key={ej.id + idx}>
                              <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 px-3 py-2.5">
                                  {ej.imagen_url ? (
                                    <img src={ej.imagen_url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                                      <span className="text-sm">💪</span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{ej.nombre}</p>
                                    {ej.grupo_muscular && (
                                      <p className="text-xs text-gray-400">{ej.grupo_muscular}</p>
                                    )}
                                  </div>
                                  {nBadge && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${nBadge.color}`}>
                                      {nBadge.label}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setReemplazando(isReemplazandoEste ? null : { etapa: et.value, index: idx })}
                                    disabled={!!etapaRegenerando || guardando}
                                    className={`p-1.5 rounded-lg transition-colors shrink-0 disabled:opacity-40 ${
                                      isReemplazandoEste ? "bg-gray-200 text-gray-700" : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                    }`}
                                    title="Reemplazar ejercicio"
                                  >
                                    <RefreshCw size={13} />
                                  </button>
                                </div>

                                {isReemplazandoEste && (
                                  <div className="border-t border-gray-100 px-3 pb-3 pt-2">
                                    <p className="text-xs font-medium text-gray-500 mb-2">Elegir reemplazo:</p>
                                    <div className="max-h-44 overflow-y-auto rounded-xl border border-gray-100">
                                      {alternativas.length === 0 ? (
                                        <p className="px-3 py-3 text-xs text-gray-400">
                                          No hay más ejercicios disponibles para esta etapa y nivel.
                                        </p>
                                      ) : (
                                        alternativas.map((alt) => {
                                          const altNivel = alt.niveles?.[0];
                                          const altBadge = altNivel ? NIVEL_BADGE[altNivel] : null;
                                          return (
                                            <button
                                              key={alt.id}
                                              onClick={() => reemplazarEjercicio(et.value, idx, alt)}
                                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 text-left border-b border-gray-50 last:border-0"
                                            >
                                              {alt.imagen_url ? (
                                                <img src={alt.imagen_url} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                              ) : (
                                                <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0" />
                                              )}
                                              <span className="flex-1 truncate text-gray-900 font-medium">{alt.nombre}</span>
                                              {altBadge && (
                                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${altBadge.color}`}>
                                                  {altBadge.label}
                                                </span>
                                              )}
                                            </button>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 shrink-0">
          {error && !cargando && (
            <div className="mb-3 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={cargarSugerencia}
              disabled={cargando || guardando}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {cargando ? <Loader2 size={14} className="animate-spin" /> : <Shuffle size={14} />}
              Generar nueva sugerencia
            </button>
            <div className="flex-1" />
            <button
              onClick={confirmar}
              disabled={cargando || guardando || !tieneSugerencia}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Confirmar y guardar rutina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
