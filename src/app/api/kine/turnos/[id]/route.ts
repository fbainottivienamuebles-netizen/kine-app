import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const updateSchema = z.object({
  pacienteId: z.string().min(1).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  tipoTratamiento: z
    .enum(["MASAJES", "REHABILITACION", "DRENAJE_LINFATICO", "DRENAJE_BOTAS", "DRENAJE_KINE", "HIPOPRESIVOS"])
    .optional(),
  usaBotas: z.boolean().optional(),
  estado: z.enum(["PENDIENTE", "CONFIRMADO", "PRESENTE", "AUSENTE", "CANCELADO"]).optional(),
  notas: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { pacienteId, fecha, horaInicio, horaFin, tipoTratamiento, usaBotas, estado, notas } = parsed.data;

  if (horaInicio && horaFin && horaFin <= horaInicio) {
    return NextResponse.json({ error: "La hora de fin debe ser mayor a la de inicio" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {};
  if (pacienteId !== undefined) updates.paciente_id = pacienteId;
  if (fecha !== undefined) updates.fecha = fecha;
  if (horaInicio !== undefined) updates.hora_inicio = horaInicio + ":00";
  if (horaFin !== undefined) updates.hora_fin = horaFin + ":00";
  if (tipoTratamiento !== undefined) updates.tipo_tratamiento = tipoTratamiento;
  if (usaBotas !== undefined) updates.usa_botas = usaBotas;
  if (estado !== undefined) updates.estado = estado;
  if (notas !== undefined) updates.notas = notas;

  const { data, error } = await supabase
    .from("turnos")
    .update(updates)
    .eq("id", id)
    .select("*, paciente:pacientes_kine(id, nombre, dni)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("turnos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
