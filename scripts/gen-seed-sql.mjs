import bcrypt from "bcryptjs";

const hashAdmin = await bcrypt.hash("kineapp2024", 12);
const hashAsistente = await bcrypt.hash("asistente2024", 12);

console.log(`-- Usuarios iniciales KineApp`);
console.log(`INSERT INTO usuarios (id, nombre, email, password_hash, rol, activo, creado_en, actualizado_en) VALUES`);
console.log(`  ('usr_jimena_01', 'Jimena', 'jimena@kineapp.com', '${hashAdmin}', 'ADMIN', true, NOW(), NOW()),`);
console.log(`  ('usr_asistente_01', 'Asistente', 'asistente@kineapp.com', '${hashAsistente}', 'ASISTENTE', true, NOW(), NOW());`);
