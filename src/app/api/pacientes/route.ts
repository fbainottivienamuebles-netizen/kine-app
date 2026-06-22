import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const pacienteSchema = z.object({
  nombre: z.string().min(1),
  dni: z.string().optional().or(z.literal("")),
  telefono: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  fechaNacimiento: z.string().optional().or(z.literal("")),
  obraSocial: z.string().optional().or(z.literal("")),
  activoKine: z.boolean().default(false),
  nroAfiliado: z.string().optional().or(z.literal("")),
  diagnostico: z.string().optional().or(z.literal("")),
  tratamientos: z.array(z.enum(["MASAJES","REHABILITACION","DRENAJE_LINFATICO","DRENAJE_BOTAS","DRENAJE_KINE","HIPOPRESIVOS"])).default([]),
  observaciones: z.string().optional().or(z.literal("")),
  activoGym: z.boolean().default(false),
  contactoEmergencia: z.string().optional().or(z.literal("")),
  observacionesMedicas: z.string().optional().or(z.literal("")),
  diasAsignados: z.array(z.enum(["LUNES","MARTES","MIERCOLES","JUEVES","VIERNES","SABADO"])).default([]),
  fechaInicioGym: z.string().optional().or(z.literal("")),
  estadoGym: z.enum(["ACTIVO","INACTIVO","VACACIONES"]).default("ACTIVO"),
  nivelEntrenamiento: z.enum(["basico","intermedio","avanzado"]).default("basico"),
});

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const modulo = searchParams.get("modulo") ?? "";

  const supabase = createServiceClient();
  let query = supabase
    .from("pacientes")
    .select("id, nombre, dni, telefono, obra_social, activo_kine, activo_gym, tratamientos, dias_asignados, estado_gym")
    .eq("activo", true)
    .order("nombre", { ascending: true });

  if (q) query = query.ilike("nombre", `%${q}%`);
  if (modulo === "kine") query = query.eq("activo_kine", true);
  if (modulo === "gym") query = query.eq("activo_gym", true);

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

  const { nombre, dni, telefono, email, fechaNacimiento, obraSocial,
    activoKine, nroAfiliado, diagnostico, tratamientos, observaciones,
    activoGym, contactoEmergencia, observacionesMedicas, diasAsignados, fechaInicioGym, estadoGym, nivelEntrenamiento } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pacientes")
    .insert({
      id: randomUUID(),
      nombre,
      dni: dni || null,
      telefono: telefono || null,
      email: email || null,
      fecha_nacimiento: fechaNacimiento || null,
      obra_social: obraSocial || null,
      activo_kine: activoKine,
      nro_afiliado: nroAfiliado || null,
      diagnostico: diagnostico || null,
      tratamientos,
      observaciones: observaciones || null,
      activo_gym: activoGym,
      contacto_emergencia: contactoEmergencia || null,
      observaciones_medicas: observacionesMedicas || null,
      dias_asignados: diasAsignados,
      fecha_inicio_gym: fechaInicioGym || (activoGym ? new Date().toISOString().slice(0, 10) : null),
      estado_gym: estadoGym,
      nivel_entrenamiento: nivelEntrenamiento,
      activo: true,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Ya existe un paciente con ese DNI" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
