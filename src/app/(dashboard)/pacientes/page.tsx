"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Phone, CreditCard, User, Trash2 } from "lucide-react";
import { PacienteModal } from "@/components/paciente-modal";
import { ETIQUETAS_TRATAMIENTO } from "@/lib/utils";

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
  activo: boolean;
};

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroModulo, setFiltroModulo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Paciente | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const [eliminando, setEliminando] = useState(false);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.set("q", busqueda);
      if (filtroModulo) params.set("modulo", filtroModulo);
      const res = await fetch(`/api/pacientes?${params}`);
      const data = await res.json();
      setPacientes(Array.isArray(data) ? data : []);
      setSeleccionados(new Set());
    } catch { setPacientes([]); }
    finally { setLoading(false); }
  }, [busqueda, filtroModulo]);

  useEffect(() => { fetchPacientes(); }, [fetchPacientes]);

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    setSeleccionados(seleccionados.size === pacientes.length ? new Set() : new Set(pacientes.map((p) => p.id)));
  }

  async function eliminarUno(id: string) {
    const p = pacientes.find((x) => x.id === id);
    if (!confirm(`¿Eliminar a ${p?.nombre ?? "este paciente"}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/pacientes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "No se pudo eliminar el paciente");
      return;
    }
    fetchPacientes();
  }

  async function eliminarSeleccionados() {
    if (!seleccionados.size) return;
    if (!confirm(`¿Eliminar ${seleccionados.size} paciente${seleccionados.size > 1 ? "s" : ""}? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    const errores: string[] = [];
    await Promise.all([...seleccionados].map(async (id) => {
      const res = await fetch(`/api/pacientes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const p = pacientes.find((x) => x.id === id);
        const data = await res.json().catch(() => ({}));
        errores.push(`${p?.nombre ?? id}: ${data.error ?? "error"}`);
      }
    }));
    setEliminando(false);
    if (errores.length) alert(`No se pudieron eliminar:\n${errores.join("\n")}`);
    fetchPacientes();
  }

  function calcularEdad(fechaNac: string | null) {
    if (!fechaNac) return null;
    const nac = new Date(fechaNac);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() - nac.getMonth() < 0 || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--;
    return `${edad} años`;
  }

  const todosSeleccionados = pacientes.length > 0 && seleccionados.size === pacientes.length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{pacientes.length} {pacientes.length === 1 ? "paciente" : "pacientes"}</p>
        </div>
        <div className="flex items-center gap-2">
          {seleccionados.size > 0 && (
            <button onClick={eliminarSeleccionados} disabled={eliminando}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-60">
              <Trash2 size={15} /> Eliminar ({seleccionados.size})
            </button>
          )}
          <button onClick={() => { setSeleccionado(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus size={16} /> Nuevo paciente
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
        </div>
        <div className="flex gap-1">
          {[{ v: "", label: "Todos" }, { v: "kine", label: "Kine" }, { v: "gym", label: "Gym" }].map((f) => (
            <button key={f.v} onClick={() => setFiltroModulo(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filtroModulo === f.v ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">Cargando pacientes...</div>
      ) : pacientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <User size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{busqueda ? "Sin resultados" : "No hay pacientes registrados"}</p>
          {!busqueda && (
            <button onClick={() => { setSeleccionado(null); setModalOpen(true); }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
              Crear el primer paciente
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2 px-1">
            <input type="checkbox" checked={todosSeleccionados} onChange={toggleTodos}
              className="w-4 h-4 rounded accent-indigo-600 cursor-pointer" />
            <span className="text-xs text-gray-400">Seleccionar todos</span>
          </div>

          <div className="grid gap-2">
            {pacientes.map((p) => (
              <div key={p.id}
                className={`bg-white rounded-2xl border shadow-sm p-4 transition-all flex items-start gap-3 ${
                  seleccionados.has(p.id) ? "border-indigo-300 bg-indigo-50/40" : "border-gray-100 hover:border-indigo-200 hover:shadow-md"
                }`}>
                <div className="pt-0.5 shrink-0">
                  <input type="checkbox" checked={seleccionados.has(p.id)} onChange={() => toggleSeleccion(p.id)}
                    className="w-4 h-4 rounded accent-indigo-600 cursor-pointer" />
                </div>

                <button onClick={() => { setSeleccionado(p); setModalOpen(true); }}
                  className="flex-1 min-w-0 text-left group">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{p.nombre}</h3>
                    {p.activo_kine && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Kine</span>
                    )}
                    {p.activo_gym && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Gym</span>
                    )}
                    {p.activo_kine && p.tratamientos?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tratamientos.slice(0, 2).map((t) => (
                          <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {ETIQUETAS_TRATAMIENTO[t] ?? t}
                          </span>
                        ))}
                        {p.tratamientos.length > 2 && <span className="text-[10px] text-gray-400">+{p.tratamientos.length - 2}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                    {p.dni && <span className="flex items-center gap-1"><CreditCard size={13} className="text-gray-400" />DNI {p.dni}</span>}
                    {p.fecha_nacimiento && <span>{calcularEdad(p.fecha_nacimiento)}</span>}
                    {p.telefono && <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" />{p.telefono}</span>}
                    {p.obra_social && <span className="text-indigo-600">{p.obra_social}</span>}
                  </div>
                </button>

                <button onClick={() => eliminarUno(p.id)}
                  className="shrink-0 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Eliminar paciente">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <PacienteModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSeleccionado(null); }}
        onSuccess={() => { fetchPacientes(); setModalOpen(false); setSeleccionado(null); }}
        paciente={seleccionado}
      />
    </div>
  );
}
