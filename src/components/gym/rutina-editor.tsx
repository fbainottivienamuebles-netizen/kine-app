"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Plus, Trash2, Loader2, Search, GripVertical, UserPlus } from "lucide-react";
import { PacienteModal } from "@/components/paciente-modal";
import { SugerirRutinaModal } from "@/components/gym/sugerir-rutina-modal";

type EjercicioBiblioteca = { id: string; nombre: string; grupo_muscular: string | null; nivel: string };
type PacienteGym = { id: string; nombre: string; dias_asignados: string[] };

type EjercicioRutinaForm = {
  _key: string;
  ejercicioId: string | null;
  nombreLibre: string;
  etapa: string;
  seriesS1: string; repsS1: string;
  seriesS2: string; repsS2: string;
  seriesS3: string; repsS3: string;
  seriesS4: string; repsS4: string;
  notas: string;
  orden: number;
  ejercicioNombre?: string;
};

type RutinaExistente = {
  id: string;
  fecha_inicio: string;
  fecha_vencimiento: string;
  estado: string;
  paciente: PacienteGym;
  ejercicios: Array<{
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
    ejercicio: EjercicioBiblioteca | null;
  }>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  rutina?: RutinaExistente | null;
  pacienteInicial?: PacienteGym | null;
};

const ETAPAS = [
  { value: "ENTRADA_CALOR", label: "Entrada en calor" },
  { value: "PRIMERA_ETAPA", label: "1ª Etapa" },
  { value: "SEGUNDA_ETAPA", label: "2ª Etapa" },
  { value: "TERCERA_ETAPA", label: "3ª Etapa" },
  { value: "TRABAJO_FINAL", label: "Trabajo final" },
] as const;

const ETAPA_COLORS: Record<string, string> = {
  ENTRADA_CALOR: "bg-amber-50 border-amber-200 text-amber-800",
  PRIMERA_ETAPA: "bg-blue-50 border-blue-200 text-blue-800",
  SEGUNDA_ETAPA: "bg-indigo-50 border-indigo-200 text-indigo-800",
  TERCERA_ETAPA: "bg-purple-50 border-purple-200 text-purple-800",
  TRABAJO_FINAL: "bg-rose-50 border-rose-200 text-rose-800",
};

let keyCounter = 0;
function nextKey() { return String(++keyCounter); }

function nuevoEjercicio(etapa: string): EjercicioRutinaForm {
  return {
    _key: nextKey(),
    ejercicioId: null, nombreLibre: "", etapa,
    seriesS1: "4", repsS1: "8", seriesS2: "4", repsS2: "6",
    seriesS3: "3", repsS3: "8", seriesS4: "4", repsS4: "8",
    notas: "", orden: 0,
  };
}

export function RutinaEditor({ isOpen, onClose, onSuccess, rutina, pacienteInicial }: Props) {
  const editando = !!rutina;

  const [pacientes, setPacientes] = useState<PacienteGym[]>([]);
  const [biblioteca, setBiblioteca] = useState<EjercicioBiblioteca[]>([]);
  const [busquedaPaciente, setBusquedaPaciente] = useState("");
  const [busquedaEjercicio, setBusquedaEjercicio] = useState("");
  const [pacienteId, setPacienteId] = useState("");
  const [pacienteNombre, setPacienteNombre] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [ejercicios, setEjercicios] = useState<EjercicioRutinaForm[]>([]);
  const [etapaActiva, setEtapaActiva] = useState<string>("PRIMERA_ETAPA");
  const [showBiblioteca, setShowBiblioteca] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNuevoMiembro, setShowNuevoMiembro] = useState(false);
  const [showSugerirModal, setShowSugerirModal] = useState(false);

  async function cargarMiembros() {
    fetch("/api/gym/pacientes?estado=ACTIVO")
      .then((r) => r.json()).then(setPacientes).catch(() => setPacientes([]));
  }

  useEffect(() => {
    if (!isOpen) return;
    cargarMiembros();
    fetch("/api/gym/biblioteca")
      .then((r) => r.json()).then(setBiblioteca).catch(() => setBiblioteca([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setShowSugerirModal(false);
    if (rutina) {
      setPacienteId(rutina.paciente.id);
      setPacienteNombre(rutina.paciente.nombre);
      setFechaInicio(rutina.fecha_inicio);
      setEjercicios(rutina.ejercicios.map((e) => ({
        _key: nextKey(),
        ejercicioId: e.ejercicio_id,
        nombreLibre: e.nombre_libre ?? e.ejercicio?.nombre ?? "",
        etapa: e.etapa,
        seriesS1: String(e.series_s1 ?? ""), repsS1: String(e.reps_s1 ?? ""),
        seriesS2: String(e.series_s2 ?? ""), repsS2: String(e.reps_s2 ?? ""),
        seriesS3: String(e.series_s3 ?? ""), repsS3: String(e.reps_s3 ?? ""),
        seriesS4: String(e.series_s4 ?? ""), repsS4: String(e.reps_s4 ?? ""),
        notas: e.notas ?? "", orden: e.orden,
        ejercicioNombre: e.ejercicio?.nombre ?? e.nombre_libre ?? "",
      })));
    } else if (pacienteInicial) {
      setPacienteId(pacienteInicial.id);
      setPacienteNombre(pacienteInicial.nombre);
      setFechaInicio(new Date().toISOString().slice(0, 10));
      setEjercicios([]);
    } else {
      setPacienteId(""); setPacienteNombre("");
      setFechaInicio(new Date().toISOString().slice(0, 10));
      setEjercicios([]);
    }
    setBusquedaPaciente(""); setError("");
  }, [isOpen, rutina, pacienteInicial]);

  const updateEjercicio = useCallback((key: string, field: keyof EjercicioRutinaForm, value: string) => {
    setEjercicios((prev) => prev.map((e) => e._key === key ? { ...e, [field]: value } : e));
  }, []);

  function removeEjercicio(key: string) {
    setEjercicios((prev) => prev.filter((e) => e._key !== key));
  }

  function addEjercicioLibre() {
    setEjercicios((prev) => [...prev, nuevoEjercicio(etapaActiva)]);
    setShowBiblioteca(false);
  }

  function addDesdebiblioteca(ej: EjercicioBiblioteca) {
    setEjercicios((prev) => [
      ...prev,
      { ...nuevoEjercicio(etapaActiva), ejercicioId: ej.id, nombreLibre: ej.nombre, ejercicioNombre: ej.nombre },
    ]);
    setShowBiblioteca(false);
    setBusquedaEjercicio("");
  }

  const ejerciciosFiltrados = busquedaEjercicio
    ? biblioteca.filter((e) => e.nombre.toLowerCase().includes(busquedaEjercicio.toLowerCase()))
    : biblioteca;

  const pacientesFiltrados = busquedaPaciente
    ? pacientes.filter((p) => p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase()))
    : pacientes;

  const fechaVencimiento = fechaInicio
    ? (() => {
        const d = new Date(fechaInicio + "T12:00:00");
        d.setDate(d.getDate() + 27);
        return d.toISOString().slice(0, 10);
      })()
    : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pacienteId) { setError("Seleccioná un miembro"); return; }
    setError(""); setLoading(true);
    try {
      const payload = {
        pacienteGymId: pacienteId,
        fechaInicio,
        ejercicios: ejercicios.map((e, i) => ({
          ejercicioId: e.ejercicioId || null,
          nombreLibre: e.ejercicioId ? null : e.nombreLibre,
          etapa: e.etapa,
          seriesS1: e.seriesS1 ? parseInt(e.seriesS1) : null,
          repsS1: e.repsS1 ? parseInt(e.repsS1) : null,
          seriesS2: e.seriesS2 ? parseInt(e.seriesS2) : null,
          repsS2: e.repsS2 ? parseInt(e.repsS2) : null,
          seriesS3: e.seriesS3 ? parseInt(e.seriesS3) : null,
          repsS3: e.repsS3 ? parseInt(e.repsS3) : null,
          seriesS4: e.seriesS4 ? parseInt(e.seriesS4) : null,
          repsS4: e.repsS4 ? parseInt(e.repsS4) : null,
          notas: e.notas || null,
          orden: i,
        })),
      };

      let res: Response;
      if (editando && rutina) {
        res = await fetch(`/api/gym/rutinas/${rutina.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ejercicios: payload.ejercicios }),
        });
      } else {
        res = await fetch("/api/gym/rutinas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }
      onSuccess();
      onClose();
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const ejerciciosPorEtapa = ETAPAS.map((etapa) => ({
    ...etapa,
    items: ejercicios.filter((e) => e.etapa === etapa.value),
  }));

  const mostrarSelectorModo = !editando && ejercicios.length === 0;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{editando ? "Editar rutina" : "Nueva rutina"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Header: paciente + fecha */}
          <div className="p-5 border-b border-gray-100 shrink-0">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Miembro</label>
                  {!pacienteId && !editando && (
                    <button
                      type="button"
                      onClick={() => setShowNuevoMiembro(true)}
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                    >
                      <UserPlus size={13} /> Nuevo miembro
                    </button>
                  )}
                </div>
                {pacienteId && !editando ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-sm font-medium text-emerald-900">{pacienteNombre}</span>
                    <button type="button" onClick={() => { setPacienteId(""); setPacienteNombre(""); }}
                      className="text-xs text-emerald-600 hover:text-emerald-800">Cambiar</button>
                  </div>
                ) : editando ? (
                  <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-sm font-medium text-gray-700">{pacienteNombre}</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" value={busquedaPaciente} onChange={(e) => setBusquedaPaciente(e.target.value)}
                        placeholder="Buscar miembro..." className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    {pacientesFiltrados.length === 0 ? (
                      <div className="px-1 py-2 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {pacientes.length === 0 ? "No hay miembros activos." : "Sin resultados."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowNuevoMiembro(true)}
                          className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                        >
                          <UserPlus size={13} /> Crear miembro
                        </button>
                      </div>
                    ) : (
                      <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                        {pacientesFiltrados.slice(0, 6).map((p) => (
                          <button key={p.id} type="button" onClick={() => { setPacienteId(p.id); setPacienteNombre(p.nombre); }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-gray-900">
                            {p.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required disabled={editando}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-50" />
                {fechaVencimiento && (
                  <p className="mt-1 text-xs text-gray-400">Vence: {fechaVencimiento.split("-").reverse().join("/")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Editor ejercicios */}
          <div className="flex flex-1 min-h-0 overflow-hidden">
            {mostrarSelectorModo ? (
              /* Mode selector when no exercises yet */
              <div className="flex-1 flex items-center justify-center p-8">
                {!pacienteId ? (
                  <p className="text-sm text-gray-400">Seleccioná un miembro para comenzar</p>
                ) : (
                  <div className="text-center w-full max-w-xs">
                    <p className="text-sm text-gray-500 mb-4">¿Cómo querés armar esta rutina?</p>
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={() => setShowSugerirModal(true)}
                        className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
                      >
                        ✨ Sugerir rutina automáticamente
                      </button>
                      <button
                        type="button"
                        onClick={addEjercicioLibre}
                        className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        📝 Armar manualmente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Sidebar etapas */}
                <div className="w-44 border-r border-gray-100 p-3 shrink-0 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Etapa</p>
                  {ETAPAS.map((et) => {
                    const count = ejercicios.filter((e) => e.etapa === et.value).length;
                    return (
                      <button key={et.value} type="button" onClick={() => setEtapaActiva(et.value)}
                        className={`w-full text-left px-2 py-2 rounded-xl text-xs font-medium mb-1 transition-all ${
                          etapaActiva === et.value ? ETAPA_COLORS[et.value] + " border" : "text-gray-600 hover:bg-gray-50"
                        }`}>
                        {et.label}
                        {count > 0 && <span className="ml-1 text-[10px] opacity-60">({count})</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Lista ejercicios de etapa activa */}
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">
                      {ETAPAS.find((e) => e.value === etapaActiva)?.label}
                    </h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowBiblioteca(true)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100">
                        <Search size={12} /> Biblioteca
                      </button>
                      <button type="button" onClick={addEjercicioLibre}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200">
                        <Plus size={12} /> Libre
                      </button>
                    </div>
                  </div>

                  {/* Buscador biblioteca */}
                  {showBiblioteca && (
                    <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <input type="text" value={busquedaEjercicio} onChange={(e) => setBusquedaEjercicio(e.target.value)}
                          placeholder="Buscar en biblioteca..." autoFocus
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        <button type="button" onClick={() => setShowBiblioteca(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                      </div>
                      <div className="max-h-40 overflow-y-auto divide-y divide-emerald-100">
                        {ejerciciosFiltrados.slice(0, 10).map((ej) => (
                          <button key={ej.id} type="button" onClick={() => addDesdebiblioteca(ej)}
                            className="w-full text-left px-2 py-1.5 text-sm hover:bg-emerald-100 rounded-lg">
                            <span className="font-medium text-gray-900">{ej.nombre}</span>
                            {ej.grupo_muscular && <span className="text-gray-500 ml-2 text-xs">{ej.grupo_muscular}</span>}
                          </button>
                        ))}
                        {ejerciciosFiltrados.length === 0 && (
                          <p className="px-2 py-2 text-xs text-gray-400">Sin resultados</p>
                        )}
                      </div>
                    </div>
                  )}

                  {ejerciciosPorEtapa.find((e) => e.value === etapaActiva)?.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Agregá ejercicios desde la biblioteca o escribí uno libre
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {ejerciciosPorEtapa.find((e) => e.value === etapaActiva)?.items.map((ej) => (
                        <div key={ej._key} className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                          <div className="flex items-start gap-2 mb-2">
                            <GripVertical size={14} className="text-gray-300 mt-1 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <input type="text" value={ej.nombreLibre} onChange={(e) => updateEjercicio(ej._key, "nombreLibre", e.target.value)}
                                placeholder="Nombre del ejercicio..." required
                                className="w-full px-2 py-1 text-sm font-medium rounded-lg border border-transparent focus:border-gray-300 focus:outline-none bg-transparent focus:bg-white" />
                            </div>
                            <button type="button" onClick={() => removeEjercicio(ej._key)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0">
                              <Trash2 size={13} />
                            </button>
                          </div>

                          {/* Series/Reps por semana */}
                          <div className="grid grid-cols-4 gap-2">
                            {[1, 2, 3, 4].map((s) => (
                              <div key={s}>
                                <p className="text-[10px] text-gray-400 font-medium text-center mb-1">Sem {s}</p>
                                <div className="flex gap-1">
                                  <input type="number" min="1" max="50"
                                    value={ej[`repsS${s}` as keyof EjercicioRutinaForm] as string}
                                    onChange={(e) => updateEjercicio(ej._key, `repsS${s}` as keyof EjercicioRutinaForm, e.target.value)}
                                    placeholder="R"
                                    className="w-10 px-1 py-1 text-xs text-center rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                  <span className="text-gray-300 text-xs self-center">×</span>
                                  <input type="number" min="1" max="20"
                                    value={ej[`seriesS${s}` as keyof EjercicioRutinaForm] as string}
                                    onChange={(e) => updateEjercicio(ej._key, `seriesS${s}` as keyof EjercicioRutinaForm, e.target.value)}
                                    placeholder="S"
                                    className="w-10 px-1 py-1 text-xs text-center rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                                </div>
                              </div>
                            ))}
                          </div>

                          <input type="text" value={ej.notas} onChange={(e) => updateEjercicio(ej._key, "notas", e.target.value)}
                            placeholder="Notas (carga, progresión...)"
                            className="mt-2 w-full px-2 py-1 text-xs rounded-lg border border-transparent focus:border-gray-300 focus:outline-none bg-transparent focus:bg-white text-gray-500" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 shrink-0">
            {error && <div className="mb-3 bg-red-50 text-red-600 text-sm px-4 py-2 rounded-xl border border-red-200">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              {(!mostrarSelectorModo || editando) && (
                <button type="submit" disabled={loading}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {editando ? "Guardar cambios" : "Crear rutina"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
    <PacienteModal
      isOpen={showNuevoMiembro}
      moduloDefault="gym"
      onClose={() => setShowNuevoMiembro(false)}
      onSuccess={async () => {
        setShowNuevoMiembro(false);
        await cargarMiembros();
        setBusquedaPaciente("");
      }}
    />
    <SugerirRutinaModal
      isOpen={showSugerirModal}
      onClose={() => setShowSugerirModal(false)}
      onSuccess={() => { onSuccess(); onClose(); }}
      pacienteId={pacienteId}
      pacienteNombre={pacienteNombre}
      fechaInicio={fechaInicio}
    />
    </>
  );
}
