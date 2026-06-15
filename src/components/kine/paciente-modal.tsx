"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ETIQUETAS_TRATAMIENTO } from "@/lib/utils";

type Paciente = {
  id: string;
  nombre: string;
  dni: string;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  obra_social: string | null;
  nro_afiliado: string | null;
  diagnostico: string | null;
  tratamientos: string[];
  observaciones: string | null;
  activo: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paciente?: Paciente | null;
};

const TRATAMIENTOS = [
  "MASAJES",
  "REHABILITACION",
  "DRENAJE_LINFATICO",
  "DRENAJE_BOTAS",
  "DRENAJE_KINE",
  "HIPOPRESIVOS",
] as const;

export function PacienteModal({ isOpen, onClose, onSuccess, paciente }: Props) {
  const editando = !!paciente;

  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [obraSocial, setObraSocial] = useState("");
  const [nroAfiliado, setNroAfiliado] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamientos, setTratamientos] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (paciente) {
      setNombre(paciente.nombre);
      setDni(paciente.dni);
      setTelefono(paciente.telefono ?? "");
      setEmail(paciente.email ?? "");
      setFechaNacimiento(paciente.fecha_nacimiento ?? "");
      setObraSocial(paciente.obra_social ?? "");
      setNroAfiliado(paciente.nro_afiliado ?? "");
      setDiagnostico(paciente.diagnostico ?? "");
      setTratamientos(paciente.tratamientos ?? []);
      setObservaciones(paciente.observaciones ?? "");
    } else {
      setNombre(""); setDni(""); setTelefono(""); setEmail("");
      setFechaNacimiento(""); setObraSocial(""); setNroAfiliado("");
      setDiagnostico(""); setTratamientos([]); setObservaciones("");
    }
    setError("");
  }, [isOpen, paciente]);

  function toggleTratamiento(t: string) {
    setTratamientos((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = editando ? `/api/kine/pacientes/${paciente!.id}` : "/api/kine/pacientes";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, dni, telefono, email, fechaNacimiento, obraSocial, nroAfiliado, diagnostico, tratamientos, observaciones }),
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

  async function handleDesactivar() {
    if (!paciente || !confirm(`¿Dar de baja a ${paciente.nombre}?`)) return;
    setLoading(true);
    try {
      await fetch(`/api/kine/pacientes/${paciente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: false }),
      });
      onSuccess();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editando ? "Editar paciente" : "Nuevo paciente"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Datos personales */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Datos personales</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y apellido <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej: María González"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  required
                  placeholder="Ej: 30123456"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 2215 123456"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: maria@email.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Obra social */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Cobertura médica</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Obra social / Mutual</label>
                <input
                  type="text"
                  value={obraSocial}
                  onChange={(e) => setObraSocial(e.target.value)}
                  placeholder="Ej: IOMA, OSDE, etc."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nro. de afiliado</label>
                <input
                  type="text"
                  value={nroAfiliado}
                  onChange={(e) => setNroAfiliado(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Clínico */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Información clínica</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <input
                  type="text"
                  value={diagnostico}
                  onChange={(e) => setDiagnostico(e.target.value)}
                  placeholder="Ej: Lumbalgia crónica"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tratamientos</label>
                <div className="flex flex-wrap gap-2">
                  {TRATAMIENTOS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTratamiento(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        tratamientos.includes(t)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {ETIQUETAS_TRATAMIENTO[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows={3}
                  placeholder="Notas clínicas, antecedentes, indicaciones especiales..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
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
                onClick={handleDesactivar}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Dar de baja
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
              {editando ? "Guardar cambios" : "Crear paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
