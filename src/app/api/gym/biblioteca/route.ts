import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const ejercicioSchema = z.object({
  nombre: z.string().min(1),
  descripcion: z.string().optional().nullable(),
  grupoMuscular: z.string().optional().nullable(),
  nivel: z.enum(["BAJO","MEDIO","ALTO"]).default("MEDIO"),
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
    .select("id, nombre, grupo_muscular, nivel, descripcion, imagen_url")
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

  const { nombre, descripcion, grupoMuscular, nivel, contraindicaciones, imagenUrl } = parsed.data;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("biblioteca_ejercicios")
    .insert({ nombre, descripcion: descripcion || null, grupo_muscular: grupoMuscular || null, nivel, contraindicaciones: contraindicaciones || null, imagen_url: imagenUrl || null, activo: true })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
