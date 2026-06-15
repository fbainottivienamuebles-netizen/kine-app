import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const ejercicioRutinaSchema = z.object({
  ejercicioId: z.string().optional().nullable(),
  nombreLibre: z.string().optional().nullable(),
  etapa: z.enum(["ENTRADA_CALOR","PRIMERA_ETAPA","SEGUNDA_ETAPA","TERCERA_ETAPA","TRABAJO_FINAL"]),
  seriesS1: z.number().int().optional().nullable(),
  repsS1: z.number().int().optional().nullable(),
  seriesS2: z.number().int().optional().nullable(),
  repsS2: z.number().int().optional().nullable(),
  seriesS3: z.number().int().optional().nullable(),
  repsS3: z.number().int().optional().nullable(),
  seriesS4: z.number().int().optional().nullable(),
  repsS4: z.number().int().optional().nullable(),
  notas: z.string().optional().nullable(),
  orden: z.number().int().default(0),
});

const rutinaSchema = z.object({
  pacienteGymId: z.string().min(1),
  fechaInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ejercicios: z.array(ejercicioRutinaSchema).default([]),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pacienteId = searchParams.get("pacienteId");
  const estado = searchParams.get("estado");

  const supabase = createServiceClient();
  let query = supabase
    .from("rutinas")
    .select(`
      id, fecha_inicio, fecha_vencimiento, estado, creado_en,
      paciente:pacientes_gym(id, nombre, dias_asignados),
      ejercicios:ejercicios_rutina(
        id, ejercicio_id, nombre_libre, etapa, orden,
        series_s1, reps_s1, series_s2, reps_s2,
        series_s3, reps_s3, series_s4, reps_s4, notas,
        ejercicio:biblioteca_ejercicios(id, nombre, grupo_muscular, nivel)
      )
    `)
    .order("fecha_inicio", { ascending: false });

  if (pacienteId) query = query.eq("paciente_gym_id", pacienteId);
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = rutinaSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });

  const { pacienteGymId, fechaInicio, ejercicios } = parsed.data;

  const fechaInicioDate = new Date(fechaInicio + "T12:00:00");
  const fechaVencimiento = new Date(fechaInicioDate);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 27);
  const fechaVencimientoStr = fechaVencimiento.toISOString().slice(0, 10);

  const supabase = createServiceClient();

  // Mark previous active rutinas as VENCIDA
  await supabase
    .from("rutinas")
    .update({ estado: "VENCIDA" })
    .eq("paciente_gym_id", pacienteGymId)
    .eq("estado", "ACTIVA");

  const { data: rutina, error: rutinaError } = await supabase
    .from("rutinas")
    .insert({
      paciente_gym_id: pacienteGymId,
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVencimientoStr,
      estado: "ACTIVA",
      creado_por_id: session.userId,
    })
    .select()
    .single();

  if (rutinaError) return NextResponse.json({ error: rutinaError.message }, { status: 500 });

  if (ejercicios.length > 0) {
    const rows = ejercicios.map((e, i) => ({
      rutina_id: rutina.id,
      ejercicio_id: e.ejercicioId || null,
      nombre_libre: e.nombreLibre || null,
      etapa: e.etapa,
      series_s1: e.seriesS1 ?? null,
      reps_s1: e.repsS1 ?? null,
      series_s2: e.seriesS2 ?? null,
      reps_s2: e.repsS2 ?? null,
      series_s3: e.seriesS3 ?? null,
      reps_s3: e.repsS3 ?? null,
      series_s4: e.seriesS4 ?? null,
      reps_s4: e.repsS4 ?? null,
      notas: e.notas || null,
      orden: e.orden ?? i,
    }));

    const { error: ejError } = await supabase.from("ejercicios_rutina").insert(rows);
    if (ejError) return NextResponse.json({ error: ejError.message }, { status: 500 });
  }

  const { data: full, error: fullError } = await supabase
    .from("rutinas")
    .select(`
      id, fecha_inicio, fecha_vencimiento, estado,
      paciente:pacientes_gym(id, nombre, dias_asignados),
      ejercicios:ejercicios_rutina(
        id, ejercicio_id, nombre_libre, etapa, orden,
        series_s1, reps_s1, series_s2, reps_s2,
        series_s3, reps_s3, series_s4, reps_s4, notas,
        ejercicio:biblioteca_ejercicios(id, nombre, grupo_muscular, nivel)
      )
    `)
    .eq("id", rutina.id)
    .single();

  if (fullError) return NextResponse.json(rutina, { status: 201 });
  return NextResponse.json(full, { status: 201 });
}
