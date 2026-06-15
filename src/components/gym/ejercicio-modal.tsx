"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";

type Ejercicio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  grupo_muscular: string | null;
  nivel: string;
  contraindicaciones: string | null;
  imagen_url: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ejercicio?: Ejercicio | null;
};

const NIVELES = [
  { value: "BAJO", label: "Bajo" },
  { value: "MEDIO", label: "Medio" },
  { value: "ALTO", label: "Alto" },
] as const;

const GRUPOS = [
  "Piernas", "Glúteos", "Espalda", "Pecho", "Hombros", "Brazos",
  "Core", "Cardio", "Full body", "Movilidad",
];

export function EjercicioModal({ isOpen, onClose, onSuccess, ejercicio }: Props) {
  const editando = !!ejercicio;

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [grupoMuscular, setGrupoMuscular] = useState("");
  const [grupoCustom, setGrupoCustom] = useState("");
  const [nivel, setNivel] = useState("MEDIO");
  const [contraindicaciones, setContraindicaciones] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (ejercicio) {
      setNombre(ejercicio.nombre);
      setDescripcion(ejercicio.descripcion ?? "");
      const gm = ejercicio.grupo_muscular ?? "";
      setGrupoMuscular(GRUPOS.includes(gm) ? gm : "otro");
      setGrupoCustom(GRUPOS.includes(gm) ? "" : gm);
      setNivel(ejercicio.nivel ?? "MEDIO");
      setContraindicaciones(ejercicio.contraindicaciones ?? "");
      setImagenUrl(ejercicio.imagen_url ?? "");
    } else {
      setNombre(""); setDescripcion(""); setGrupoMuscular(""); setGrupoCustom("");
      setNivel("MEDIO"); setContraindicaciones(""); setImagenUrl("");
    }
    setError("");
  }, [isOpen, ejercicio]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const grupoFinal = grupoMuscular === "otro" ? grupoCustom : grupoMuscular;
    try {
      const url = editando ? `/api/gym/biblioteca/${ejercicio!.id}` : "/api/gym/biblioteca";
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, descripcion, grupoMuscular: grupoFinal, nivel, contraindicaciones, imagenUrl }),
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

  async function handleArchivar() {
    if (!ejercicio) return;
    setLoading(true);
    try {
      await fetch(`/api/gym/biblioteca/${ejercicio.id}`, {
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{editando ? "Editar ejercicio" : "Nuevo ejercicio"}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required
              placeholder="Ej: Sentadilla con barra"
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grupo muscular</label>
              <select value={grupoMuscular} onChange={(e) => setGrupoMuscular(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">— Seleccionar —</option>
                {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
                <option value="otro">Otro...</option>
              </select>
              {grupoMuscular === "otro" && (
                <input type="text" value={grupoCustom} onChange={(e) => setGrupoCustom(e.target.value)}
                  placeholder="Especificar..." className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
              <div className="flex gap-1">
                {NIVELES.map((n) => (
                  <button key={n.value} type="button" onClick={() => setNivel(n.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      nivel === n.value ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                    }`}>
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Ejecución</label>
            <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} rows={3}
              placeholder="Cómo se ejecuta correctamente..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraindicaciones</label>
            <textarea value={contraindicaciones} onChange={(e) => setContraindicaciones(e.target.value)} rows={2}
              placeholder="Quién no debe hacer este ejercicio..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de imagen (opcional)</label>
            <input type="url" value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">{error}</div>}

          <div className="flex gap-2">
            {editando && (
              <button type="button" onClick={handleArchivar} disabled={loading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50">
                Archivar
              </button>
            )}
            <div className="flex-1" />
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center gap-2">
              {loading && <Loader2 size={14} className="animate-spin" />}
              {editando ? "Guardar" : "Crear ejercicio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
