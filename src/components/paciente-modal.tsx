"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { ETIQUETAS_TRATAMIENTO, DIAS_SEMANA } from "@/lib/utils";

type Paciente = {
  id: string;
  nombre: string;
  dni: string | null;
  telefono: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  obra_social: string | null;
  nro_afiliado: string | null;
  diagnostico: string | null;
  tratamientos: string[];
  observaciones: string | null;
  activo_kine: boolean;
  activo_gym: boolean;
  contacto_emergencia: string | null;
  observaciones_medicas: string | null;
  dias_asignados: string[];
  fecha_inicio_gym: string | null;
  estado_gym: string;
  nivel_entrenamiento?: string;
  activo: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paciente?: Paciente | null;
  moduloDefault?: "kine" | "gym" | null;
};

const TRATAMIENTOS = ["REHABILITACION","DRENAJE_BOTAS","HIPOPRESIVOS"] as const;
const ESTADOS_GYM = [{ value: "ACTIVO", label: "Activo" }, { value: "INACTIVO", label: "Inactivo" }, { value: "VACACIONES", label: "Vacaciones" }] as const;

export function PacienteModal({ isOpen, onClose, onSuccess, paciente, moduloDefault }: Props) {
  const editando = !!paciente;

  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [obraSocial, setObraSocial] = useState("");

  const [activoKine, setActivoKine] = useState(false);
  const [nroAfiliado, setNroAfiliado] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [tratamientos, setTratamientos] = useState<string[]>([]);
  const [observaciones, setObservaciones] = useState("");

  const [activoGym, setActivoGym] = useState(false);
  const [contactoEmergencia, setContactoEmergencia] = useState("");
  const [observacionesMedicas, setObservacionesMedicas] = useState("");
  const [diasAsignados, setDiasAsignados] = useState<string[]>([]);
  const [fechaInicioGym, setFechaInicioGym] = useState("");
  const [estadoGym, setEstadoGym] = useState("ACTIVO");
  const [nivelEntrenamiento, setNivelEntrenamiento] = useState("basico");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (paciente) {
      setNombre(paciente.nombre);
      setDni(paciente.dni ?? "");
      setTelefono(paciente.telefono ?? "");
      setEmail(paciente.email ?? "");
      setFechaNacimiento(paciente.fecha_nacimiento?.slice(0, 10) ?? "");
      setObraSocial(paciente.obra_social ?? "");
      setActivoKine(paciente.activo_kine);
      setNroAfiliado(paciente.nro_afiliado ?? "");
      setDiagnostico(paciente.diagnostico ?? "");
      setTratamientos(paciente.tratamientos ?? []);
      setObservaciones(paciente.observaciones ?? "");
      setActivoGym(paciente.activo_gym);
      setContactoEmergencia(paciente.contacto_emergencia ?? "");
      setObservacionesMedicas(paciente.observaciones_medicas ?? "");
      setDiasAsignados(paciente.dias_asignados ?? []);
      setFechaInicioGym(paciente.fecha_inicio_gym ?? "");
      setEstadoGym(paciente.estado_gym ?? "ACTIVO");
      setNivelEntrenamiento(paciente.nivel_entrenamiento ?? "basico");
    } else {
      setNombre(""); setDni(""); setTelefono(""); setEmail("");
      setFechaNacimiento(""); setObraSocial("");
      setActivoKine(moduloDefault === "kine");
      setNroAfiliado(""); setDiagnostico(""); setTratamientos([]); setObservaciones("");
      setActivoGym(moduloDefault === "gym");
      setContactoEmergencia(""); setObservacionesMedicas(""); setDiasAsignados([]);
      setFechaInicioGym(new Date().toISOString().slice(0, 10));
      setEstadoGym("ACTIVO");
      setNivelEntrenamiento("basico");
    }
    setError("");
  }, [isOpen, paciente, moduloDefault]);

  function toggleTratamiento(t: string) {
    setTratamientos((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }
  function toggleDia(dia: string) {
    setDiasAsignados((prev) => prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activoKine && !activoGym) { setError("Asigná el paciente al menos a Kinesiología o Gimnasio"); return; }
    setError("");
    setLoading(true);
    try {
      const url = editando ? `/api/pacientes/${paciente!.id}` : "/api/pacientes";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre, dni, telefono, email, fechaNacimiento, obraSocial,
          activoKine, nroAfiliado, diagnostico, tratamientos, observaciones,
          activoGym, contactoEmergencia, observacionesMedicas, diasAsignados, fechaInicioGym, estadoGym, nivelEntrenamiento,
        }),
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
          {/* Datos comunes */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Datos personales</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y apellido <span className="text-red-500">*</span></label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
                  placeholder="Ej: María González"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                <input type="text" value={dni} onChange={(e) => setDni(e.target.value)}
                  placeholder="Ej: 30123456"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
                <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej: 2215 123456"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: maria@email.com"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Obra social / Mutual</label>
                <input type="text" value={obraSocial} onChange={(e) => setObraSocial(e.target.value)}
                  placeholder="Ej: IOMA, OSDE..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>

          {/* Módulo Kinesiología */}
          <div className={`rounded-2xl border-2 transition-all ${activoKine ? "border-indigo-300 bg-indigo-50/30" : "border-gray-100 bg-gray-50/50"}`}>
            <button type="button" onClick={() => setActivoKine((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${activoKine ? "bg-indigo-600 border-indigo-600" : "border-gray-300"}`}>
                  {activoKine && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm font-semibold text-gray-800">Kinesiología</span>
              </div>
              <span className="text-xs text-gray-400">{activoKine ? "Habilitado" : "Sin asignar"}</span>
            </button>

            {activoKine && (
              <div className="px-4 pb-4 space-y-3 border-t border-indigo-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nro. de afiliado</label>
                    <input type="text" value={nroAfiliado} onChange={(e) => setNroAfiliado(e.target.value)}
                      placeholder="Ej: 123456789"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                    <input type="text" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)}
                      placeholder="Ej: Lumbalgia crónica"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tratamientos</label>
                  <div className="flex flex-wrap gap-2">
                    {TRATAMIENTOS.map((t) => (
                      <button key={t} type="button" onClick={() => toggleTratamiento(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          tratamientos.includes(t) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                        }`}>
                        {ETIQUETAS_TRATAMIENTO[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones clínicas</label>
                  <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={2}
                    placeholder="Antecedentes, indicaciones..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                </div>
              </div>
            )}
          </div>

          {/* Módulo Gimnasio */}
          <div className={`rounded-2xl border-2 transition-all ${activoGym ? "border-emerald-300 bg-emerald-50/30" : "border-gray-100 bg-gray-50/50"}`}>
            <button type="button" onClick={() => setActivoGym((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${activoGym ? "bg-emerald-600 border-emerald-600" : "border-gray-300"}`}>
                  {activoGym && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-sm font-semibold text-gray-800">Gimnasio</span>
              </div>
              <span className="text-xs text-gray-400">{activoGym ? "Habilitado" : "Sin asignar"}</span>
            </button>

            {activoGym && (
              <div className="px-4 pb-4 space-y-3 border-t border-emerald-100 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia</label>
                    <input type="text" value={contactoEmergencia} onChange={(e) => setContactoEmergencia(e.target.value)}
                      placeholder="Nombre y teléfono"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select value={estadoGym} onChange={(e) => setEstadoGym(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {ESTADOS_GYM.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
                    <input type="date" value={fechaInicioGym} onChange={(e) => setFechaInicioGym(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nivel de entrenamiento</label>
                    <div className="flex gap-1">
                      {[
                        { value: "basico", label: "Básico", active: "bg-emerald-600 text-white border-emerald-600" },
                        { value: "intermedio", label: "Interm.", active: "bg-amber-500 text-white border-amber-500" },
                        { value: "avanzado", label: "Avanz.", active: "bg-red-500 text-white border-red-500" },
                      ].map((n) => (
                        <button key={n.value} type="button" onClick={() => setNivelEntrenamiento(n.value)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            nivelEntrenamiento === n.value ? n.active : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}>
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Días de entrenamiento</label>
                  <div className="flex gap-2">
                    {DIAS_SEMANA.map((d) => (
                      <button key={d.value} type="button" onClick={() => toggleDia(d.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          diasAsignados.includes(d.value) ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                        }`}>
                        {d.label.slice(0, 2)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones médicas</label>
                  <textarea value={observacionesMedicas} onChange={(e) => setObservacionesMedicas(e.target.value)} rows={2}
                    placeholder="Lesiones, restricciones..."
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>
          )}

          <div className="flex gap-2 pt-1">
            <div className="flex-1" />
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editando ? "Guardar cambios" : "Crear paciente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
