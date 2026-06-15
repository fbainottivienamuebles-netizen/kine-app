import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const turnoSchema = z.object({
  pacienteId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
  tipoTratamiento: z.enum([
    "MASAJES",
    "REHABILITACION",
    "DRENAJE_LINFATICO",
    "DRENAJE_BOTAS",
    "DRENAJE_KINE",
    "HIPOPRESIVOS",
  ]),
  usaBotas: z.boolean().default(false),
  notas: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  if (!desde || !hasta) {
    return NextResponse.json({ error: "Faltan parámetros desde y hasta" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("turnos")
    .select("*, paciente:pacientes_kine(id, nombre, dni)")
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = turnoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { pacienteId, fecha, horaInicio, horaFin, tipoTratamiento, usaBotas, notas } = parsed.data;

  if (horaFin <= horaInicio) {
    return NextResponse.json({ error: "La hora de fin debe ser mayor a la de inicio" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { count, error: countError } = await supabase
    .from("turnos")
    .select("*", { count: "exact", head: true })
    .eq("fecha", fecha)
    .not("estado", "in", "(CANCELADO,AUSENTE)")
    .lt("hora_inicio", horaFin + ":00")
    .gt("hora_fin", horaInicio + ":00");

  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  if ((count ?? 0) >= 2) {
    return NextResponse.json({ error: "Ya hay 2 pacientes en ese horario" }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("turnos")
    .insert({
      paciente_id: pacienteId,
      fecha,
      hora_inicio: horaInicio + ":00",
      hora_fin: horaFin + ":00",
      tipo_tratamiento: tipoTratamiento,
      usa_botas: usaBotas,
      estado: "PENDIENTE",
      notas: notas || null,
      creado_por_id: session.userId,
    })
    .select("*, paciente:pacientes_kine(id, nombre, dni)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
