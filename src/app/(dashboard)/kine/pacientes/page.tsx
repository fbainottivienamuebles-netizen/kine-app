"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Phone, CreditCard, User, Trash2 } from "lucide-react";
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
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [eliminando, setEliminando] = useState(false);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const q = busqueda.trim();
      const url = q ? `/api/kine/pacientes?q=${encodeURIComponent(q)}` : "/api/kine/pacientes";
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPacientes(data);
      setSeleccionados(new Set());
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

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (seleccionados.size === pacientes.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(pacientes.map((p) => p.id)));
    }
  }

  async function eliminarUno(id: string) {
    const p = pacientes.find((x) => x.id === id);
    if (!confirm(`¿Eliminar a ${p?.nombre ?? "este paciente"}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/kine/pacientes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar el paciente");
      return;
    }
    fetchPacientes();
  }

  async function eliminarSeleccionados() {
    if (seleccionados.size === 0) return;
    if (!confirm(`¿Eliminar ${seleccionados.size} paciente${seleccionados.size > 1 ? "s" : ""}? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    const errores: string[] = [];
    await Promise.all(
      [...seleccionados].map(async (id) => {
        const res = await fetch(`/api/kine/pacientes/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const p = pacientes.find((x) => x.id === id);
          const data = await res.json().catch(() => ({}));
          errores.push(`${p?.nombre ?? id}: ${data.error ?? "error"}`);
        }
      })
    );
    setEliminando(false);
    if (errores.length > 0) alert(`No se pudieron eliminar:\n${errores.join("\n")}`);
    fetchPacientes();
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

  const todosSeleccionados = pacientes.length > 0 && seleccionados.size === pacientes.length;
  const algunoSeleccionado = seleccionados.size > 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kinesiología · {pacientes.length} {pacientes.length === 1 ? "paciente" : "pacientes"}</p>
        </div>
        <div className="flex items-center gap-2">
          {algunoSeleccionado && (
            <button
              onClick={eliminarSeleccionados}
              disabled={eliminando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              <Trash2 size={15} />
              Eliminar ({seleccionados.size})
            </button>
          )}
          <button
            onClick={() => { setPacienteSeleccionado(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Nuevo paciente
          </button>
        </div>
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
              onClick={() => { setPacienteSeleccionado(null); setModalOpen(true); }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Crear el primer paciente
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Seleccionar todos */}
          <div className="flex items-center gap-2 mb-2 px-1">
            <input
              type="checkbox"
              checked={todosSeleccionados}
              onChange={toggleTodos}
              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-gray-400">Seleccionar todos</span>
          </div>

          <div className="grid gap-2">
            {pacientes.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 transition-all flex items-start gap-3 ${
                  seleccionados.has(p.id) ? "border-indigo-300 bg-indigo-50/40" : "border-gray-100 hover:border-indigo-200 hover:shadow-md"
                }`}
              >
                {/* Checkbox */}
                <div className="pt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    checked={seleccionados.has(p.id)}
                    onChange={() => toggleSeleccion(p.id)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* Info — clickeable para editar */}
                <button
                  onClick={() => handleEditar(p)}
                  className="flex-1 min-w-0 text-left group"
                >
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                      {p.nombre}
                    </h3>
                    {p.tratamientos?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tratamientos.slice(0, 3).map((t) => (
                          <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
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
                    {p.dni && (
                      <span className="flex items-center gap-1">
                        <CreditCard size={13} className="text-gray-400" />
                        DNI {p.dni}
                      </span>
                    )}
                    {p.fecha_nacimiento && <span>{calcularEdad(p.fecha_nacimiento)}</span>}
                    {p.telefono && (
                      <span className="flex items-center gap-1">
                        <Phone size={13} className="text-gray-400" />
                        {p.telefono}
                      </span>
                    )}
                    {p.obra_social && <span className="text-indigo-600">{p.obra_social}</span>}
                  </div>
                  {p.diagnostico && (
                    <p className="mt-1 text-xs text-gray-400 truncate">{p.diagnostico}</p>
                  )}
                </button>

                {/* Papelera */}
                <button
                  onClick={() => eliminarUno(p.id)}
                  className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Eliminar paciente"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
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
