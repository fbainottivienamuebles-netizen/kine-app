"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Phone, CreditCard, User } from "lucide-react";
import { PacienteModal } from "@/components/kine/paciente-modal";
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

export default function PacientesKinePage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const q = busqueda.trim();
      const url = q ? `/api/kine/pacientes?q=${encodeURIComponent(q)}` : "/api/kine/pacientes";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPacientes(data);
    } catch {
      setPacientes([]);
    } finally {
      setLoading(false);
    }
  }, [busqueda]);

  useEffect(() => { fetchPacientes(); }, [fetchPacientes]);

  function handleEditar(p: Paciente) {
    setPacienteSeleccionado(p);
    setModalOpen(true);
  }

  function handleNuevo() {
    setPacienteSeleccionado(null);
    setModalOpen(true);
  }

  function calcularEdad(fechaNac: string | null): string {
    if (!fechaNac) return "—";
    const nac = new Date(fechaNac);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    const mes = hoy.getMonth() - nac.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
    return `${edad} años`;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kinesiología · {pacientes.length} {pacientes.length === 1 ? "paciente" : "pacientes"}</p>
        </div>
        <button
          onClick={handleNuevo}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Nuevo paciente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">
          Cargando pacientes...
        </div>
      ) : pacientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <User size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {busqueda ? "Sin resultados para esa búsqueda" : "No hay pacientes registrados"}
          </p>
          {!busqueda && (
            <button
              onClick={handleNuevo}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Crear el primer paciente
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {pacientes.map((p) => (
            <button
              key={p.id}
              onClick={() => handleEditar(p)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-indigo-200 hover:shadow-md transition-all text-left w-full group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {p.nombre}
                    </h3>
                    {p.tratamientos?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tratamientos.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {ETIQUETAS_TRATAMIENTO[t] ?? t}
                          </span>
                        ))}
                        {p.tratamientos.length > 3 && (
                          <span className="text-[10px] text-gray-400">+{p.tratamientos.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <CreditCard size={13} className="text-gray-400" />
                      DNI {p.dni}
                    </span>
                    {p.fecha_nacimiento && (
                      <span>{calcularEdad(p.fecha_nacimiento)}</span>
                    )}
                    {p.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-gray-400" />
                        {p.telefono}
                      </span>
                    )}
                    {p.obra_social && (
                      <span className="text-indigo-600">{p.obra_social}</span>
                    )}
                  </div>

                  {p.diagnostico && (
                    <p className="mt-1 text-xs text-gray-400 truncate">{p.diagnostico}</p>
                  )}
                </div>

                <div className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Editar →
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <PacienteModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPacienteSeleccionado(null); }}
        onSuccess={() => { fetchPacientes(); setModalOpen(false); setPacienteSeleccionado(null); }}
        paciente={pacienteSeleccionado}
      />
    </div>
  );
}
