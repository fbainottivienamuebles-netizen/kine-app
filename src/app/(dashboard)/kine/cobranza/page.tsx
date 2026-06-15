"use client";

import { useCallback, useEffect, useState } from "react";
import { DollarSign, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { CobroModal } from "@/components/kine/cobro-modal";
import { ETIQUETAS_TRATAMIENTO, ETIQUETAS_FORMA_PAGO } from "@/lib/utils";

type CobroData = {
  id: string;
  importe: number;
  forma_pago: string;
  estado: string;
  fecha_pago: string | null;
  nro_recibo: number | null;
  notas: string | null;
};

type TurnoItem = {
  id: string;
  fecha: string;
  hora_inicio: string;
  tipo_tratamiento: string;
  estado: string;
  paciente: { id: string; nombre: string; dni: string };
  cobro: CobroData[] | null;
};

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export default function CobranzaKinePage() {
  const [turnos, setTurnos] = useState<TurnoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(() => new Date().getMonth() + 1);
  const [anio, setAnio] = useState(() => new Date().getFullYear());
  const [filtroEstado, setFiltroEstado] = useState<"" | "PENDIENTE" | "PAGADO">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<TurnoItem | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const desde = `${anio}-${String(mes).padStart(2, "0")}-01`;
      const hasta = `${anio}-${String(mes).padStart(2, "0")}-31`;
      const params = new URLSearchParams({ desde, hasta });
      if (filtroEstado) params.set("estado", filtroEstado);
      const res = await fetch(`/api/kine/cobros?${params}`);
      const data = await res.json();
      setTurnos(Array.isArray(data) ? data : []);
    } catch {
      setTurnos([]);
    } finally {
      setLoading(false);
    }
  }, [mes, anio, filtroEstado]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleClick(t: TurnoItem) {
    setTurnoSeleccionado(t);
    setModalOpen(true);
  }

  const totalCobrado = turnos.reduce((acc, t) => {
    const c = t.cobro?.[0];
    return acc + (c?.estado === "PAGADO" ? Number(c.importe) : 0);
  }, 0);
  const totalPendiente = turnos.filter((t) => !t.cobro?.length).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cobranza</h1>
          <p className="text-gray-500 text-sm mt-0.5">Kinesiología</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Cobrado este período</p>
          <p className="text-2xl font-bold text-emerald-600">${totalCobrado.toLocaleString("es-AR")}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Turnos sin cobrar</p>
          <p className="text-2xl font-bold text-amber-500">{totalPendiente}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-500 mb-1">Total turnos</p>
          <p className="text-2xl font-bold text-gray-800">{turnos.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select value={mes} onChange={(e) => setMes(Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}
          className="px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="flex gap-1">
          {([
            { v: "" as const, label: "Todos" },
            { v: "PENDIENTE" as const, label: "Sin cobrar" },
            { v: "PAGADO" as const, label: "Cobrados" },
          ]).map((f) => (
            <button key={f.v} onClick={() => setFiltroEstado(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filtroEstado === f.v ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm">Cargando...</div>
      ) : turnos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <DollarSign size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Sin turnos para este período</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Paciente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Tratamiento</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Importe</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Forma</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {turnos.map((t) => {
                const cobro = t.cobro?.[0];
                return (
                  <tr key={t.id} onClick={() => handleClick(t)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{t.paciente?.nombre}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {t.fecha.slice(0, 10).split("-").reverse().join("/")}
                      <span className="text-gray-400 ml-1">{t.hora_inicio.slice(0, 5)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{ETIQUETAS_TRATAMIENTO[t.tipo_tratamiento] ?? t.tipo_tratamiento}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      {cobro ? `$${Number(cobro.importe).toLocaleString("es-AR")}` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {cobro ? (ETIQUETAS_FORMA_PAGO[cobro.forma_pago] ?? cobro.forma_pago) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cobro?.estado === "PAGADO" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 size={11} /> Pagado
                        </span>
                      ) : cobro?.estado === "PARCIAL" ? (
                        <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">Parcial</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                          <Clock size={11} /> Pendiente
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CobroModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setTurnoSeleccionado(null); }}
        onSuccess={() => { fetchData(); setModalOpen(false); setTurnoSeleccionado(null); }}
        turno={turnoSeleccionado}
      />
    </div>
  );
}
