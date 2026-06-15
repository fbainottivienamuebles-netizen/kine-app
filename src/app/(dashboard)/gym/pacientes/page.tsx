"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Phone, User } from "lucide-react";
import { PacienteGymModal } from "@/components/gym/paciente-gym-modal";
import { RutinaEditor } from "@/components/gym/rutina-editor";
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

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: "bg-emerald-50 text-emerald-700",
  INACTIVO: "bg-gray-100 text-gray-500",
  VACACIONES: "bg-amber-50 text-amber-700",
};
const ESTADO_LABELS: Record<string, string> = { ACTIVO: "Activo", INACTIVO: "Inactivo", VACACIONES: "Vacaciones" };

export default function PacientesGymPage() {
  const [pacientes, setPacientes] = useState<PacienteGym[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [rutinaOpen, setRutinaOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<PacienteGym | null>(null);

  const fetchPacientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.set("q", busqueda);
      if (filtroEstado) params.set("estado", filtroEstado);
      const res = await fetch(`/api/gym/pacientes?${params}`);
      setPacientes(await res.json());
    } catch { setPacientes([]); }
    finally { setLoading(false); }
  }, [busqueda, filtroEstado]);

  useEffect(() => { fetchPacientes(); }, [fetchPacientes]);

  const diaToPosicion = Object.fromEntries(DIAS_SEMANA.map((d, i) => [d.value, i]));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Miembros</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gimnasio · {pacientes.length} {pacientes.length === 1 ? "miembro" : "miembros"}</p>
        </div>
        <button onClick={() => { setSeleccionado(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus size={16} /> Nuevo miembro
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Buscar por nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
        </div>
        <div className="flex gap-1">
          {[{ v: "", label: "Todos" }, { v: "ACTIVO", label: "Activos" }, { v: "INACTIVO", label: "Inactivos" }, { v: "VACACIONES", label: "Vacaciones" }].map((f) => (
            <button key={f.v} onClick={() => setFiltroEstado(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filtroEstado === f.v ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">Cargando...</div>
      ) : pacientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <User size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{busqueda ? "Sin resultados" : "No hay miembros registrados"}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pacientes.map((p) => {
            const diasOrdenados = [...(p.dias_asignados ?? [])].sort((a, b) => (diaToPosicion[a] ?? 9) - (diaToPosicion[b] ?? 9));
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{p.nombre}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ESTADO_COLORS[p.estado] ?? "bg-gray-100 text-gray-500"}`}>
                        {ESTADO_LABELS[p.estado] ?? p.estado}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      {p.telefono && <span className="flex items-center gap-1"><Phone size={13} className="text-gray-400" />{p.telefono}</span>}
                      {diasOrdenados.length > 0 && (
                        <span className="flex gap-1">
                          {diasOrdenados.map((d) => (
                            <span key={d} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                              {d.slice(0, 2)}
                            </span>
                          ))}
                        </span>
                      )}
                      {p.obra_social && <span className="text-indigo-600">{p.obra_social}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setSeleccionado(p); setRutinaOpen(true); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition-colors">
                      + Rutina
                    </button>
                    <button onClick={() => { setSeleccionado(p); setModalOpen(true); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PacienteGymModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSeleccionado(null); }}
        onSuccess={() => { fetchPacientes(); setModalOpen(false); setSeleccionado(null); }}
        paciente={seleccionado}
      />

      <RutinaEditor
        isOpen={rutinaOpen}
        onClose={() => { setRutinaOpen(false); setSeleccionado(null); }}
        onSuccess={() => { setRutinaOpen(false); setSeleccionado(null); }}
        pacienteInicial={seleccionado}
      />
    </div>
  );
}
