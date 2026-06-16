"use client";

import { useEffect, useState } from "react";
import { X, Loader2, UserPlus } from "lucide-react";
import { ETIQUETAS_TRATAMIENTO, ETIQUETAS_ESTADO_TURNO } from "@/lib/utils";
import { PacienteModal } from "@/components/paciente-modal";

type Paciente = { id: string; nombre: string; dni: string | null };

type Turno = {
  id: string;
  paciente_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_tratamiento: string;
  usa_botas: boolean;
  estado: string;
  notas: string | null;
  paciente: Paciente | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  turno?: Turno | null;
  initialDate?: string;
  initialHoraInicio?: string;
  initialHoraFin?: string;
};

const TRATAMIENTOS = [
  "MASAJES",
  "REHABILITACION",
  "DRENAJE_LINFATICO",
  "DRENAJE_BOTAS",
  "DRENAJE_KINE",
  "HIPOPRESIVOS",
] as const;

const ESTADOS = ["PENDIENTE", "CONFIRMADO", "PRESENTE", "AUSENTE", "CANCELADO"] as const;

const TRATAMIENTO_COLORS: Record<string, string> = {
  MASAJES: "bg-blue-100 text-blue-800 border-blue-300",
  REHABILITACION: "bg-green-100 text-green-800 border-green-300",
  DRENAJE_LINFATICO: "bg-purple-100 text-purple-800 border-purple-300",
  DRENAJE_BOTAS: "bg-violet-200 text-violet-900 border-violet-400",
  DRENAJE_KINE: "bg-teal-100 text-teal-800 border-teal-300",
  HIPOPRESIVOS: "bg-orange-100 text-orange-800 border-orange-300",
};

function generarHoras(): string[] {
  const horas: string[] = [];
  for (let h = 8; h < 20; h++) {
    horas.push(`${String(h).padStart(2, "0")}:00`);
    horas.push(`${String(h).padStart(2, "0")}:30`);
  }
  horas.push("20:00");
  return horas;
}

const HORAS = generarHoras();

export function TurnoModal({ isOpen, onClose, onSuccess, turno, initialDate, initialHoraInicio, initialHoraFin }: Props) {
  const editando = !!turno;

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [pacienteId, setPacienteId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  const [tipo, setTipo] = useState<string>("MASAJES");
  const [usaBotas, setUsaBotas] = useState(false);
  const [estado, setEstado] = useState("PENDIENTE");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNuevoPaciente, setShowNuevoPaciente] = useState(false);

  async function cargarPacientes() {
    fetch("/api/kine/pacientes")
      .then((r) => r.json())
      .then(setPacientes)
      .catch(() => setPacientes([]));
  }

  useEffect(() => {
    if (!isOpen) return;
    cargarPacientes();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (turno) {
      setPacienteId(turno.paciente_id);
      setFecha(turno.fecha);
      setHoraInicio(turno.hora_inicio.slice(0, 5));
      setHoraFin(turno.hora_fin.slice(0, 5));
      setTipo(turno.tipo_tratamiento);
      setUsaBotas(turno.usa_botas);
      setEstado(turno.estado);
      setNotas(turno.notas ?? "");
    } else {
      setPacienteId("");
      setFecha(initialDate ?? new Date().toISOString().slice(0, 10));
      setHoraInicio(initialHoraInicio ?? "09:00");
      setHoraFin(initialHoraFin ?? "10:00");
      setTipo("MASAJES");
      setUsaBotas(false);
      setEstado("PENDIENTE");
      setNotas("");
    }
    setError("");
    setBusqueda("");
  }, [isOpen, turno, initialDate, initialHoraInicio, initialHoraFin]);

  const pacientesFiltrados = busqueda
    ? pacientes.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.dni ?? "").includes(busqueda))
    : pacientes;

  const pacienteSeleccionado = pacientes.find((p) => p.id === pacienteId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pacienteId) { setError("Seleccioná un paciente"); return; }
    setError("");
    setLoading(true);
    try {
      const url = editando ? `/api/kine/turnos/${turno!.id}` : "/api/kine/turnos";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pacienteId, fecha, horaInicio, horaFin, tipoTratamiento: tipo, usaBotas, estado, notas }),
      });
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

  async function handleEliminar() {
    if (!turno || !confirm("¿Eliminar este turno?")) return;
    setLoading(true);
    try {
      await fetch(`/api/kine/turnos/${turno.id}`, { method: "DELETE" });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editando ? "Editar turno" : "Nuevo turno"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Paciente */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Paciente</label>
              {!pacienteSeleccionado && (
                <button
                  type="button"
                  onClick={() => setShowNuevoPaciente(true)}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <UserPlus size={13} /> Nuevo paciente
                </button>
              )}
            </div>
            {pacienteSeleccionado ? (
              <div className="flex items-center justify-between px-3 py-2 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-sm font-medium text-indigo-900">
                  {pacienteSeleccionado.nombre}{pacienteSeleccionado.dni && <span className="font-normal text-indigo-600"> — DNI {pacienteSeleccionado.dni}</span>}
                </span>
                <button type="button" onClick={() => { setPacienteId(""); setBusqueda(""); }} className="text-xs text-indigo-500 hover:text-indigo-700">Cambiar</button>
              </div>
            ) : (
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre o DNI..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {pacientesFiltrados.length === 0 ? (
                  <div className="px-1 py-2 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {pacientes.length === 0 ? "No hay pacientes registrados." : "Sin resultados."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowNuevoPaciente(true)}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      <UserPlus size={13} /> Crear paciente
                    </button>
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                    {pacientesFiltrados.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPacienteId(p.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900">{p.nombre}</span>
                        {p.dni && <span className="text-gray-500 ml-2">DNI {p.dni}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fecha y horarios */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
              <select
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {HORAS.filter((h) => h < "20:00").map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
              <select
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {HORAS.filter((h) => h > horaInicio).map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de tratamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de tratamiento</label>
            <div className="grid grid-cols-2 gap-2">
              {TRATAMIENTOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                    tipo === t
                      ? TRATAMIENTO_COLORS[t] + " ring-2 ring-offset-1 ring-indigo-400"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {ETIQUETAS_TRATAMIENTO[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Usa botas */}
          {(tipo === "DRENAJE_LINFATICO" || tipo === "DRENAJE_KINE" || tipo === "DRENAJE_BOTAS") && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={usaBotas}
                onChange={(e) => setUsaBotas(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <span className="text-sm text-gray-700">Usa botas de compresión</span>
            </label>
          )}

          {/* Estado (solo edición) */}
          {editando && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <div className="flex flex-wrap gap-2">
                {ESTADOS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEstado(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      estado === s
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {ETIQUETAS_ESTADO_TURNO[s]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Observaciones del turno..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {editando && (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editando ? "Guardar cambios" : "Crear turno"}
            </button>
          </div>
        </form>
      </div>
    </div>
    <PacienteModal
      isOpen={showNuevoPaciente}
      moduloDefault="kine"
      onClose={() => setShowNuevoPaciente(false)}
      onSuccess={async () => {
        setShowNuevoPaciente(false);
        await cargarPacientes();
        setBusqueda("");
      }}
    />
    </>
  );
}
