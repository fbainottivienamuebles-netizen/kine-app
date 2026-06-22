import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const NIVELES_VALIDOS = ["basico", "intermedio", "avanzado"] as const;
const ETAPAS_VALIDAS = ["ENTRADA_CALOR", "PRIMERA_ETAPA", "SEGUNDA_ETAPA", "TERCERA_ETAPA", "TRABAJO_FINAL"] as const;

function nivelLegacy(niveles: string[]): string {
  if (niveles.includes("avanzado")) return "ALTO";
  if (niveles.includes("intermedio")) return "MEDIO";
  return "BAJO";
}

const ejercicioSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  grupoMuscular: z.string().optional().nullable(),
  niveles: z.array(z.enum(NIVELES_VALIDOS)).default(["intermedio"]),
  etapas: z.array(z.enum(ETAPAS_VALIDAS)).default([]),
  contraindicaciones: z.string().optional().nullable(),
  imagenUrl: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const grupo = searchParams.get("grupo") ?? "";

  const supabase = createServiceClient();
  let query = supabase
    .from("biblioteca_ejercicios")
    .select("id, nombre, grupo_muscular, nivel, niveles, etapas, descripcion, imagen_url")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (q) query = query.ilike("nombre", `%${q}%`);
  if (grupo) query = query.eq("grupo_muscular", grupo);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = ejercicioSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const { nombre, descripcion, grupoMuscular, niveles, etapas, contraindicaciones, imagenUrl } = parsed.data;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("biblioteca_ejercicios")
    .insert({
      id: randomUUID(),
      nombre,
      descripcion: descripcion || null,
      grupo_muscular: grupoMuscular || null,
      nivel: nivelLegacy(niveles),
      niveles,
      etapas,
      contraindicaciones: contraindicaciones || null,
      imagen_url: imagenUrl || null,
      activo: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
