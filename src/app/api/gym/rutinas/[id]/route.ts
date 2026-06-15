import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const ejercicioRutinaSchema = z.object({
  id: z.string().optional(),
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

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("rutinas")
    .select(`
      id, fecha_inicio, fecha_vencimiento, estado,
      paciente:pacientes(id, nombre, dias_asignados),
      ejercicios:ejercicios_rutina(
        id, ejercicio_id, nombre_libre, etapa, orden,
        series_s1, reps_s1, series_s2, reps_s2,
        series_s3, reps_s3, series_s4, reps_s4, notas,
        ejercicio:biblioteca_ejercicios(id, nombre, grupo_muscular, nivel)
      )
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const { ejercicios } = z.object({ ejercicios: z.array(ejercicioRutinaSchema) }).parse(body);

  const supabase = createServiceClient();

  // Replace all ejercicios: delete existing, insert new
  await supabase.from("ejercicios_rutina").delete().eq("rutina_id", id);

  if (ejercicios.length > 0) {
    const rows = ejercicios.map((e, i) => ({
      rutina_id: id,
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
    await supabase.from("ejercicios_rutina").insert(rows);
  }

  const { data, error } = await supabase
    .from("rutinas")
    .select(`
      id, fecha_inicio, fecha_vencimiento, estado,
      paciente:pacientes(id, nombre, dias_asignados),
      ejercicios:ejercicios_rutina(
        id, ejercicio_id, nombre_libre, etapa, orden,
        series_s1, reps_s1, series_s2, reps_s2,
        series_s3, reps_s3, series_s4, reps_s4, notas,
        ejercicio:biblioteca_ejercicios(id, nombre, grupo_muscular, nivel)
      )
    `)
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("rutinas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
