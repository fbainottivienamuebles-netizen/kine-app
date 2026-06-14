import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordAdmin = await bcrypt.hash("kineapp2024", 12);
  const passwordAsistente = await bcrypt.hash("asistente2024", 12);

  const jimena = await prisma.usuario.upsert({
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

  const asistente = await prisma.usuario.upsert({
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

  console.log("✅ Usuarios creados:");
  console.log("  Admin:", jimena.email, "/ contraseña: kineapp2024");
  console.log("  Asistente:", asistente.email, "/ contraseña: asistente2024");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
