import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional().nullable(),
  grupoMuscular: z.string().optional().nullable(),
  nivel: z.enum(["BAJO","MEDIO","ALTO"]).optional(),
  contraindicaciones: z.string().optional().nullable(),
  imagenUrl: z.string().optional().nullable(),
  activo: z.boolean().optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.nombre !== undefined) updates.nombre = d.nombre;
  if (d.descripcion !== undefined) updates.descripcion = d.descripcion || null;
  if (d.grupoMuscular !== undefined) updates.grupo_muscular = d.grupoMuscular || null;
  if (d.nivel !== undefined) updates.nivel = d.nivel;
  if (d.contraindicaciones !== undefined) updates.contraindicaciones = d.contraindicaciones || null;
  if (d.imagenUrl !== undefined) updates.imagen_url = d.imagenUrl || null;
  if (d.activo !== undefined) updates.activo = d.activo;

  const supabase = createServiceClient();
  const { data, error } = await supabase.from("biblioteca_ejercicios").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
