"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { AgendaCalendar } from "@/components/kine/agenda-calendar";
import { TurnoModal } from "@/components/kine/turno-modal";

type Turno = {
  id: string;
  paciente_id: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  tipo_tratamiento: string;
  usa_botas: boolean;
  estado: string;
  notas: string | null;
  paciente: { id: string; nombre: string; dni: string } | null;
};

function getRangoSemana(ref: Date): { desde: string; hasta: string } {
  const d = new Date(ref);
  const dia = d.getDay();
  const lunes = new Date(d);
  lunes.setDate(d.getDate() - ((dia + 6) % 7) - 7);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6 * 7 + 6);
  const fmt = (x: Date) => x.toISOString().slice(0, 10);
  return { desde: fmt(lunes), hasta: fmt(domingo) };
}

export default function AgendaPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nuevoOpen, setNuevoOpen] = useState(false);

  const fetchTurnos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { desde, hasta } = getRangoSemana(new Date());
      const res = await fetch(`/api/kine/turnos?desde=${desde}&hasta=${hasta}`);
      if (!res.ok) throw new Error("Error al cargar turnos");
      const data = await res.json();
      setTurnos(data);
    } catch {
      setError("No se pudieron cargar los turnos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTurnos(); }, [fetchTurnos]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 text-sm mt-0.5">Turnos del consultorio</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTurnos}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
            title="Actualizar"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => setNuevoOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            Nuevo turno
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex-1">
        {loading && turnos.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Cargando turnos...
          </div>
        ) : (
          <AgendaCalendar turnos={turnos} onRefresh={fetchTurnos} />
        )}
      </div>

      <TurnoModal
        isOpen={nuevoOpen}
        onClose={() => setNuevoOpen(false)}
        onSuccess={() => { fetchTurnos(); setNuevoOpen(false); }}
      />
    </div>
  );
}
