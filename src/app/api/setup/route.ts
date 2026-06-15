import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-setup-token");
  if (token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const passwordAdmin = await bcrypt.hash("kineapp2024", 12);
  const passwordAsistente = await bcrypt.hash("asistente2024", 12);

  await prisma.usuario.upsert({
    where: { email: "jimena@kineapp.com" },
    update: {},
    create: {
      nombre: "Jimena",
      email: "jimena@kineapp.com",
      passwordHash: passwordAdmin,
      rol: "ADMIN",
      activo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: "asistente@kineapp.com" },
    update: {},
    create: {
      nombre: "Asistente",
      email: "asistente@kineapp.com",
      passwordHash: passwordAsistente,
      rol: "ASISTENTE",
      activo: true,
    },
  });

  return NextResponse.json({ ok: true, message: "Usuarios creados correctamente" });
}
