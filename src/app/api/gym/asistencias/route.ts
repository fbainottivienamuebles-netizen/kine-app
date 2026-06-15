import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const asistenciaSchema = z.object({
  pacienteGymId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estado: z.enum(["PRESENTE","AUSENTE","TARDE","JUSTIFICO"]).default("PRESENTE"),
  semanaCiclo: z.number().int().min(1).max(4),
  observaciones: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const pacienteId = searchParams.get("pacienteId");

  const supabase = createServiceClient();
  let query = supabase
    .from("asistencias_gym")
    .select("*, paciente:pacientes_gym(id, nombre, dias_asignados)")
    .order("fecha", { ascending: false });

  if (fecha) query = query.eq("fecha", fecha);
  if (desde) query = query.gte("fecha", desde);
  if (hasta) query = query.lte("fecha", hasta);
  if (pacienteId) query = query.eq("paciente_gym_id", pacienteId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = asistenciaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { pacienteGymId, fecha, estado, semanaCiclo, observaciones } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("asistencias_gym")
    .upsert(
      { paciente_gym_id: pacienteGymId, fecha, estado, semana_ciclo: semanaCiclo, observaciones: observaciones || null },
      { onConflict: "paciente_gym_id,fecha" }
    )
    .select("*, paciente:pacientes_gym(id, nombre, dias_asignados)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
