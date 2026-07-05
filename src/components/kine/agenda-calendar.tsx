"use client";

import { useCallback, useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, getDay, startOfWeek, parse } from "date-fns";
import { es } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { COLORES_TRATAMIENTO, ETIQUETAS_TRATAMIENTO, ETIQUETAS_ESTADO_TURNO } from "@/lib/utils";
import { TurnoModal } from "./turno-modal";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { es },
});

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
  paciente: { id: string; nombre: string; dni: string; telefono?: string | null } | null;
  notificado_wa?: boolean | null;
  notificado_wa_at?: string | null;
  notificado_wa_tipo?: string | null;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Turno;
};

type Props = {
  turnos: Turno[];
  onRefresh: () => void;
};

const COLOR_BG: Record<string, string> = {
  MASAJES: "#dbeafe",
  REHABILITACION: "#dcfce7",
  DRENAJE_LINFATICO: "#f3e8ff",
  DRENAJE_BOTAS: "#ede9fe",
  DRENAJE_KINE: "#ccfbf1",
  HIPOPRESIVOS: "#ffedd5",
};

const COLOR_BORDER: Record<string, string> = {
  MASAJES: "#93c5fd",
  REHABILITACION: "#86efac",
  DRENAJE_LINFATICO: "#c084fc",
  DRENAJE_BOTAS: "#a78bfa",
  DRENAJE_KINE: "#5eead4",
  HIPOPRESIVOS: "#fdba74",
};

const COLOR_TEXT: Record<string, string> = {
  MASAJES: "#1e40af",
  REHABILITACION: "#166534",
  DRENAJE_LINFATICO: "#6b21a8",
  DRENAJE_BOTAS: "#4c1d95",
  DRENAJE_KINE: "#134e4a",
  HIPOPRESIVOS: "#9a3412",
};

function turnoToEvent(t: Turno): CalendarEvent {
  const [y, m, d] = t.fecha.split("-").map(Number);
  const [hI, mI] = t.hora_inicio.slice(0, 5).split(":").map(Number);
  const [hF, mF] = t.hora_fin.slice(0, 5).split(":").map(Number);
  return {
    id: t.id,
    title: t.paciente?.nombre ?? "Sin paciente",
    start: new Date(y, m - 1, d, hI, mI),
    end: new Date(y, m - 1, d, hF, mF),
    resource: t,
  };
}

function EventComponent({ event }: { event: CalendarEvent }) {
  const tipo = event.resource.tipo_tratamiento;
  return (
    <div className="h-full flex flex-col gap-0.5 leading-tight overflow-hidden">
      <span className="font-semibold text-[11px] truncate">
        {event.title}
        {event.resource.notificado_wa && <span title="Notificado por WhatsApp"> · ✓WA</span>}
      </span>
      <span className="text-[10px] opacity-80 truncate">{ETIQUETAS_TRATAMIENTO[tipo] ?? tipo}</span>
      <span className="text-[10px] opacity-70">{ETIQUETAS_ESTADO_TURNO[event.resource.estado] ?? event.resource.estado}</span>
    </div>
  );
}

const MESSAGES = {
  allDay: "Todo el día",
  previous: "← Anterior",
  next: "Siguiente →",
  today: "Hoy",
  month: "Mes",
  week: "Semana",
  day: "Día",
  agenda: "Agenda",
  date: "Fecha",
  time: "Hora",
  event: "Turno",
  noEventsInRange: "Sin turnos en este período.",
  showMore: (count: number) => `+${count} más`,
};

export function AgendaCalendar({ turnos, onRefresh }: Props) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState<Turno | null>(null);
  const [slotFecha, setSlotFecha] = useState<string | undefined>();
  const [slotDesde, setSlotDesde] = useState<string | undefined>();
  const [slotHasta, setSlotHasta] = useState<string | undefined>();

  const events = useMemo(() => turnos.map(turnoToEvent), [turnos]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const tipo = event.resource.tipo_tratamiento;
    const cancelado = event.resource.estado === "CANCELADO" || event.resource.estado === "AUSENTE";
    return {
      style: {
        backgroundColor: cancelado ? "#f3f4f6" : (COLOR_BG[tipo] ?? "#f9fafb"),
        borderLeft: `4px solid ${cancelado ? "#d1d5db" : (COLOR_BORDER[tipo] ?? "#9ca3af")}`,
        borderRadius: "8px",
        color: cancelado ? "#9ca3af" : (COLOR_TEXT[tipo] ?? "#374151"),
        padding: "2px 6px",
        fontSize: "12px",
        opacity: cancelado ? 0.6 : 1,
        boxShadow: "none",
        border: `1px solid ${cancelado ? "#e5e7eb" : (COLOR_BORDER[tipo] ?? "#e5e7eb")}`,
        borderLeftWidth: "4px",
      },
    };
  }, []);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setTurnoSeleccionado(event.resource);
    setSlotFecha(undefined);
    setSlotDesde(undefined);
    setSlotHasta(undefined);
    setModalOpen(true);
  }, []);

  const handleSelectSlot = useCallback(({ start, end }: { start: Date; end: Date }) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    const fechaStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const desdeStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endCapped = new Date(Math.min(end.getTime(), new Date(start.getFullYear(), start.getMonth(), start.getDate(), 20, 0).getTime()));
    const hastaStr = `${pad(endCapped.getHours())}:${pad(endCapped.getMinutes())}`;
    setTurnoSeleccionado(null);
    setSlotFecha(fechaStr);
    setSlotDesde(desdeStr);
    setSlotHasta(hastaStr === desdeStr ? `${pad(start.getHours() + 1)}:${pad(start.getMinutes())}` : hastaStr);
    setModalOpen(true);
  }, []);

  function handleClose() {
    setModalOpen(false);
    setTurnoSeleccionado(null);
  }

  return (
    <div className="h-full flex flex-col">
      <div
        style={{ height: "calc(100vh - 180px)", minHeight: 500 }}
        className="[&_.rbc-toolbar]:mb-4 [&_.rbc-toolbar]:flex [&_.rbc-toolbar]:flex-wrap [&_.rbc-toolbar]:gap-2
          [&_.rbc-toolbar-label]:font-semibold [&_.rbc-toolbar-label]:text-gray-800 [&_.rbc-toolbar-label]:text-base
          [&_.rbc-btn-group_button]:px-3 [&_.rbc-btn-group_button]:py-1.5 [&_.rbc-btn-group_button]:rounded-lg
          [&_.rbc-btn-group_button]:text-sm [&_.rbc-btn-group_button]:border [&_.rbc-btn-group_button]:border-gray-200
          [&_.rbc-btn-group_button]:text-gray-700 [&_.rbc-btn-group_button]:bg-white
          [&_.rbc-btn-group_button.rbc-active]:bg-indigo-600 [&_.rbc-btn-group_button.rbc-active]:text-white [&_.rbc-btn-group_button.rbc-active]:border-indigo-600
          [&_.rbc-header]:py-2 [&_.rbc-header]:text-xs [&_.rbc-header]:font-medium [&_.rbc-header]:text-gray-600 [&_.rbc-header]:uppercase [&_.rbc-header]:tracking-wide
          [&_.rbc-time-gutter_.rbc-timeslot-group]:border-gray-100
          [&_.rbc-day-slot_.rbc-time-slot]:border-gray-50
          [&_.rbc-today]:bg-indigo-50/40
          [&_.rbc-current-time-indicator]:bg-indigo-500 [&_.rbc-current-time-indicator]:h-0.5"
      >
        <Calendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onView={setView}
          onNavigate={setDate}
          selectable
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          components={{ event: EventComponent as never }}
          messages={MESSAGES}
          culture="es"
          defaultView={Views.WEEK}
          views={[Views.WEEK, Views.DAY, Views.AGENDA]}
          min={new Date(0, 0, 0, 8, 0)}
          max={new Date(0, 0, 0, 20, 0)}
          step={30}
          timeslots={1}
          style={{ height: "100%" }}
          formats={{
            timeGutterFormat: (date: Date) => format(date, "HH:mm", { locale: es }),
            eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, "HH:mm", { locale: es })} – ${format(end, "HH:mm", { locale: es })}`,
            dayHeaderFormat: (date: Date) => format(date, "EEEE d 'de' MMMM", { locale: es }),
            dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
              `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`,
            weekdayFormat: (date: Date) => format(date, "EEE", { locale: es }),
          }}
          popup
        />
      </div>

      <TurnoModal
        isOpen={modalOpen}
        onClose={handleClose}
        onSuccess={() => { onRefresh(); }}
        turno={turnoSeleccionado}
        initialDate={slotFecha}
        initialHoraInicio={slotDesde}
        initialHoraFin={slotHasta}
      />
    </div>
  );
}
