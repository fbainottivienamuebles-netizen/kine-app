import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, signToken, cookieOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("email", email)
    .eq("activo", true)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const usuario = data;
  const valid = await verifyPassword(password, usuario.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await signToken({
    userId: usuario.id,
    email: usuario.email,
    rol: usuario.rol as "ADMIN" | "ASISTENTE",
    nombre: usuario.nombre,
  });

  const opts = cookieOptions();
  const response = NextResponse.json({
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  });

  response.cookies.set(opts.name, token, {
    maxAge: opts.maxAge,
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: opts.path,
  });

  return response;
}
