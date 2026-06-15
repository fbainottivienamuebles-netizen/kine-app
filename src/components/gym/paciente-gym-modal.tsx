"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { DIAS_SEMANA } from "@/lib/utils";

type PacienteGym = {
  id: string;
  nombre: string;
  fecha_nacimiento: string | null;
  telefono: string | null;
  contacto_emergencia: string | null;
  obra_social: string | null;
  observaciones_medicas: string | null;
  dias_asignados: string[];
  fecha_inicio: string;
  estado: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paciente?: PacienteGym | null;
};

const ESTADOS = [
  { value: "ACTIVO", label: "Activo" },
  { value: "INACTIVO", label: "Inactivo" },
  { value: "VACACIONES", label: "Vacaciones" },
] as const;

export function PacienteGymModal({ isOpen, onClose, onSuccess, paciente }: Props) {
  const editando = !!paciente;

  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contactoEmergencia, setContactoEmergencia] = useState("");
  const [obraSocial, setObraSocial] = useState("");
  const [observacionesMedicas, setObservacionesMedicas] = useState("");
  const [diasAsignados, setDiasAsignados] = useState<string[]>([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [estado, setEstado] = useState("ACTIVO");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (paciente) {
      setNombre(paciente.nombre);
      setFechaNacimiento(paciente.fecha_nacimiento ?? "");
      setTelefono(paciente.telefono ?? "");
      setContactoEmergencia(paciente.contacto_emergencia ?? "");
      setObraSocial(paciente.obra_social ?? "");
      setObservacionesMedicas(paciente.observaciones_medicas ?? "");
      setDiasAsignados(paciente.dias_asignados ?? []);
      setFechaInicio(paciente.fecha_inicio ?? "");
      setEstado(paciente.estado ?? "ACTIVO");
    } else {
      setNombre(""); setFechaNacimiento(""); setTelefono(""); setContactoEmergencia("");
      setObraSocial(""); setObservacionesMedicas(""); setDiasAsignados([]);
      setFechaInicio(new Date().toISOString().slice(0, 10));
      setEstado("ACTIVO");
    }
    setError("");
  }, [isOpen, paciente]);

  function toggleDia(dia: string) {
    setDiasAsignados((prev) => prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = editando ? `/api/gym/pacientes/${paciente!.id}` : "/api/gym/pacientes";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, fechaNacimiento, telefono, contactoEmergencia, obraSocial, observacionesMedicas, diasAsignados, fechaInicio, estado }),
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {editando ? "Editar miembro" : "Nuevo miembro"}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y apellido <span className="text-red-500">*</span></label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                placeholder="Ej: Carlos Rodríguez"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
              <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 2215 123456"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia</label>
              <input type="text" value={contactoEmergencia} onChange={(e) => setContactoEmergencia(e.target.value)}
                placeholder="Nombre y teléfono"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Obra social</label>
              <input type="text" value={obraSocial} onChange={(e) => setObraSocial(e.target.value)}
                placeholder="Ej: IOMA"
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Días de entrenamiento</label>
            <div className="flex gap-2">
              {DIAS_SEMANA.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDia(d.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    diasAsignados.includes(d.value)
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {d.label.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {ESTADOS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones médicas</label>
            <textarea value={observacionesMedicas} onChange={(e) => setObservacionesMedicas(e.target.value)} rows={3}
              placeholder="Antecedentes, lesiones, restricciones..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

          <div className="flex gap-2">
            <div className="flex-1" />
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editando ? "Guardar cambios" : "Crear miembro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
