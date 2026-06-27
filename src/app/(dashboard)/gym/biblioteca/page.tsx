"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Dumbbell, Trash2 } from "lucide-react";
import { EjercicioModal } from "@/components/gym/ejercicio-modal";

type Ejercicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  grupo_muscular: string | null;
  nivel: string | null;
  niveles: string[] | null;
  etapas: string[] | null;
  contraindicaciones: string | null;
  imagen_url: string | null;
};

const NIVEL_BADGE: Record<string, { label: string; color: string }> = {
  basico: { label: "Básico", color: "bg-emerald-50 text-emerald-700" },
  intermedio: { label: "Intermedio", color: "bg-amber-50 text-amber-700" },
  avanzado: { label: "Avanzado", color: "bg-red-50 text-red-700" },
  BAJO: { label: "Bajo", color: "bg-emerald-50 text-emerald-700" },
  MEDIO: { label: "Medio", color: "bg-amber-50 text-amber-700" },
  ALTO: { label: "Alto", color: "bg-red-50 text-red-700" },
};

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

  const handleDelete = useCallback(async (ej: Ejercicio) => {
    if (!confirm(`¿Eliminar "${ej.nombre}" de la biblioteca?`)) return;
    setEjercicios((prev) => prev.filter((e) => e.id !== ej.id));
    try {
      const res = await fetch(`/api/gym/biblioteca/${ej.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: false }),
      });
      if (!res.ok) throw new Error();
    } catch {
      alert("No se pudo eliminar el ejercicio");
      fetchData();
    }
  }, [fetchData]);

  const SIN_GRUPO = "Sin clasificar";
  const grupos = [...new Set(ejercicios.map((e) => e.grupo_muscular || SIN_GRUPO))].sort((a, b) =>
    a === SIN_GRUPO ? 1 : b === SIN_GRUPO ? -1 : a.localeCompare(b)
  );

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
                    {ejercicios.filter((e) => (e.grupo_muscular || SIN_GRUPO) === grupo).map((ej) => (
                      <EjercicioCard key={ej.id} ejercicio={ej} onEdit={() => { setSeleccionado(ej); setModalOpen(true); }} onDelete={() => handleDelete(ej)} />
                    ))}
                  </div>
                </div>
              ))
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ejercicios.map((ej) => (
                  <EjercicioCard key={ej.id} ejercicio={ej} onEdit={() => { setSeleccionado(ej); setModalOpen(true); }} onDelete={() => handleDelete(ej)} />
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

function EjercicioCard({ ejercicio: ej, onEdit, onDelete }: { ejercicio: Ejercicio; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group">
      <button onClick={onEdit} className="w-full text-left p-4 pr-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">{ej.nombre}</span>
              {(ej.niveles?.length ? ej.niveles : ej.nivel ? [ej.nivel] : []).map((n) => {
                const badge = NIVEL_BADGE[n];
                return badge ? (
                  <span key={n} className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.color}`}>
                    {badge.label}
                  </span>
                ) : null;
              })}
            </div>
            {ej.descripcion && <p className="text-xs text-gray-500 line-clamp-2">{ej.descripcion}</p>}
          </div>
          <span className="text-xs text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Editar →</span>
        </div>
      </button>
      <button onClick={onDelete} title="Eliminar ejercicio" aria-label="Eliminar ejercicio"
        className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-300 hover:text-red-600 hover:bg-red-50 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  );
}
