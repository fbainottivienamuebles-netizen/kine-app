import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const pacienteSchema = z.object({
  nombre: z.string().min(1),
  fechaNacimiento: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  contactoEmergencia: z.string().optional().nullable(),
  obraSocial: z.string().optional().nullable(),
  observacionesMedicas: z.string().optional().nullable(),
  diasAsignados: z.array(z.enum(["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES","SABADO"])).default([]),
  fechaInicio: z.string().optional(),
  estado: z.enum(["ACTIVO","INACTIVO","VACACIONES"]).default("ACTIVO"),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const estado = searchParams.get("estado") ?? "";

  const supabase = createServiceClient();
  let query = supabase
    .from("pacientes_gym")
    .select("id, nombre, telefono, dias_asignados, fecha_inicio, estado, obra_social, fecha_nacimiento")
    .order("nombre", { ascending: true });

  if (q) query = query.ilike("nombre", `%${q}%`);
  if (estado) query = query.eq("estado", estado);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = pacienteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });

  const { nombre, fechaNacimiento, telefono, contactoEmergencia, obraSocial, observacionesMedicas, diasAsignados, fechaInicio, estado } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pacientes_gym")
    .insert({
      id: randomUUID(),
      nombre,
      fecha_nacimiento: fechaNacimiento || null,
      telefono: telefono || null,
      contacto_emergencia: contactoEmergencia || null,
      obra_social: obraSocial || null,
      observaciones_medicas: observacionesMedicas || null,
      dias_asignados: diasAsignados,
      fecha_inicio: fechaInicio || new Date().toISOString().slice(0, 10),
      estado,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
