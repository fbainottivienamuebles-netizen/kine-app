"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Dumbbell } from "lucide-react";
import { EjercicioModal } from "@/components/gym/ejercicio-modal";

type Ejercicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  grupo_muscular: string | null;
  nivel: string;
  contraindicaciones: string | null;
  imagen_url: string | null;
};

const NIVEL_COLORS: Record<string, string> = {
  BAJO: "bg-emerald-50 text-emerald-700",
  MEDIO: "bg-amber-50 text-amber-700",
  ALTO: "bg-red-50 text-red-700",
};
const NIVEL_LABELS: Record<string, string> = { BAJO: "Bajo", MEDIO: "Medio", ALTO: "Alto" };

export default function BibliotecaPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Ejercicio | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.set("q", busqueda);
      const res = await fetch(`/api/gym/biblioteca?${params}`);
      setEjercicios(await res.json());
    } catch { setEjercicios([]); }
    finally { setLoading(false); }
  }, [busqueda]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const grupos = [...new Set(ejercicios.map((e) => e.grupo_muscular).filter(Boolean))].sort();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biblioteca de ejercicios</h1>
          <p className="text-gray-500 text-sm mt-0.5">{ejercicios.length} {ejercicios.length === 1 ? "ejercicio" : "ejercicios"}</p>
        </div>
        <button onClick={() => { setSeleccionado(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
          <Plus size={16} /> Nuevo ejercicio
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar ejercicio..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white" />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">Cargando...</div>
      ) : ejercicios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Dumbbell size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{busqueda ? "Sin resultados" : "No hay ejercicios en la biblioteca"}</p>
          {!busqueda && (
            <button onClick={() => { setSeleccionado(null); setModalOpen(true); }}
              className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors">
              Agregar primer ejercicio
            </button>
          )}
        </div>
      ) : (
        <div>
          {grupos.length > 1
            ? grupos.map((grupo) => (
                <div key={grupo} className="mb-6">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">{grupo}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ejercicios.filter((e) => e.grupo_muscular === grupo).map((ej) => (
                      <EjercicioCard key={ej.id} ejercicio={ej} onEdit={() => { setSeleccionado(ej); setModalOpen(true); }} />
                    ))}
                  </div>
                </div>
              ))
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ejercicios.map((ej) => (
                  <EjercicioCard key={ej.id} ejercicio={ej} onEdit={() => { setSeleccionado(ej); setModalOpen(true); }} />
                ))}
              </div>
            )
          }
        </div>
      )}

      <EjercicioModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSeleccionado(null); }}
        onSuccess={() => { fetchData(); setModalOpen(false); setSeleccionado(null); }}
        ejercicio={seleccionado}
      />
    </div>
  );
}

function EjercicioCard({ ejercicio: ej, onEdit }: { ejercicio: Ejercicio; onEdit: () => void }) {
  return (
    <button onClick={onEdit}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-emerald-200 hover:shadow-md transition-all text-left group w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">{ej.nombre}</span>
            <span className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${NIVEL_COLORS[ej.nivel] ?? ""}`}>
              {NIVEL_LABELS[ej.nivel] ?? ej.nivel}
            </span>
          </div>
          {ej.descripcion && <p className="text-xs text-gray-500 line-clamp-2">{ej.descripcion}</p>}
        </div>
        <span className="text-xs text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Editar →</span>
      </div>
    </button>
  );
}
