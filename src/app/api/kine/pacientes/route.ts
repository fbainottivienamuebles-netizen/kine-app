import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const pacienteSchema = z.object({
  nombre: z.string().min(1),
  dni: z.string().min(6),
  telefono: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  fechaNacimiento: z.string().optional(),
  obraSocial: z.string().optional(),
  nroAfiliado: z.string().optional(),
  diagnostico: z.string().optional(),
  tratamientos: z
    .array(
      z.enum(["MASAJES", "REHABILITACION", "DRENAJE_LINFATICO", "DRENAJE_BOTAS", "DRENAJE_KINE", "HIPOPRESIVOS"])
    )
    .default([]),
  observaciones: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const supabase = createServiceClient();
  let query = supabase
    .from("pacientes_kine")
    .select("id, nombre, dni, telefono, obra_social")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (q) query = query.ilike("nombre", `%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = pacienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
  }

  const { nombre, dni, telefono, email, fechaNacimiento, obraSocial, nroAfiliado, diagnostico, tratamientos, observaciones } =
    parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pacientes_kine")
    .insert({
      nombre,
      dni,
      telefono: telefono || null,
      email: email || null,
      fecha_nacimiento: fechaNacimiento || null,
      obra_social: obraSocial || null,
      nro_afiliado: nroAfiliado || null,
      diagnostico: diagnostico || null,
      tratamientos,
      observaciones: observaciones || null,
      activo: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un paciente con ese DNI" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
