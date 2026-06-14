-- ─── KineApp — Init completo ──────────────────────────────────────────────────

-- Enums
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'ASISTENTE');
CREATE TYPE "TipoTratamiento" AS ENUM ('MASAJES', 'REHABILITACION', 'DRENAJE_LINFATICO', 'DRENAJE_BOTAS', 'DRENAJE_KINE', 'HIPOPRESIVOS');
CREATE TYPE "EstadoTurno" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'PRESENTE', 'AUSENTE', 'CANCELADO');
CREATE TYPE "FormaPago" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'OBRA_SOCIAL', 'MUTUAL');
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PAGADO', 'PARCIAL');
CREATE TYPE "EstadoPacienteGym" AS ENUM ('ACTIVO', 'INACTIVO', 'VACACIONES');
CREATE TYPE "EstadoRutina" AS ENUM ('ACTIVA', 'VENCIDA');
CREATE TYPE "EtapaRutina" AS ENUM ('ENTRADA_CALOR', 'PRIMERA_ETAPA', 'SEGUNDA_ETAPA', 'TERCERA_ETAPA', 'TRABAJO_FINAL');
CREATE TYPE "NivelEjercicio" AS ENUM ('BAJO', 'MEDIO', 'ALTO');
CREATE TYPE "FuenteImagen" AS ENUM ('BANCO', 'SUBIDA');
CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDE', 'JUSTIFICO');
CREATE TYPE "EstadoCuotaGym" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO');

-- Tabla: usuarios
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ASISTENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- Tabla: pacientes_kine
CREATE TABLE "pacientes_kine" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "email" TEXT,
    "obra_social" TEXT,
    "nro_afiliado" TEXT,
    "diagnostico" TEXT,
    "tratamientos" "TipoTratamiento"[],
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pacientes_kine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "pacientes_kine_dni_key" ON "pacientes_kine"("dni");

-- Tabla: turnos
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TIME NOT NULL,
    "hora_fin" TIME NOT NULL,
    "tipo_tratamiento" "TipoTratamiento" NOT NULL,
    "usa_botas" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "creado_por_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- Tabla: cobros_kine
CREATE TABLE "cobros_kine" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "paciente_id" TEXT NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pago" DATE,
    "nro_recibo" SERIAL,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cobros_kine_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cobros_kine_turno_id_key" ON "cobros_kine"("turno_id");

-- Tabla: pacientes_gym
CREATE TABLE "pacientes_gym" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fecha_nacimiento" TIMESTAMP(3),
    "telefono" TEXT,
    "contacto_emergencia" TEXT,
    "obra_social" TEXT,
    "observaciones_medicas" TEXT,
    "dias_asignados" TEXT[],
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoPacienteGym" NOT NULL DEFAULT 'ACTIVO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pacientes_gym_pkey" PRIMARY KEY ("id")
);

-- Tabla: biblioteca_ejercicios
CREATE TABLE "biblioteca_ejercicios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "grupo_muscular" TEXT,
    "nivel" "NivelEjercicio" NOT NULL DEFAULT 'MEDIO',
    "contraindicaciones" TEXT,
    "imagen_url" TEXT,
    "imagen_fuente" "FuenteImagen",
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "biblioteca_ejercicios_pkey" PRIMARY KEY ("id")
);

-- Tabla: rutinas
CREATE TABLE "rutinas" (
    "id" TEXT NOT NULL,
    "paciente_gym_id" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "estado" "EstadoRutina" NOT NULL DEFAULT 'ACTIVA',
    "creado_por_id" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rutinas_pkey" PRIMARY KEY ("id")
);

-- Tabla: ejercicios_rutina
CREATE TABLE "ejercicios_rutina" (
    "id" TEXT NOT NULL,
    "rutina_id" TEXT NOT NULL,
    "ejercicio_id" TEXT,
    "nombre_libre" TEXT,
    "etapa" "EtapaRutina" NOT NULL,
    "series_s1" INTEGER,
    "reps_s1" INTEGER,
    "series_s2" INTEGER,
    "reps_s2" INTEGER,
    "series_s3" INTEGER,
    "reps_s3" INTEGER,
    "series_s4" INTEGER,
    "reps_s4" INTEGER,
    "notas" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ejercicios_rutina_pkey" PRIMARY KEY ("id")
);

-- Tabla: asistencias_gym
CREATE TABLE "asistencias_gym" (
    "id" TEXT NOT NULL,
    "paciente_gym_id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "estado" "EstadoAsistencia" NOT NULL DEFAULT 'PRESENTE',
    "semana_ciclo" INTEGER NOT NULL,
    "observaciones" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asistencias_gym_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "asistencias_gym_paciente_gym_id_fecha_key" ON "asistencias_gym"("paciente_gym_id", "fecha");

-- Tabla: cobros_gym
CREATE TABLE "cobros_gym" (
    "id" TEXT NOT NULL,
    "paciente_gym_id" TEXT NOT NULL,
    "periodo_mes" INTEGER NOT NULL,
    "periodo_anio" INTEGER NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "estado" "EstadoCuotaGym" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pago" DATE,
    "notas" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cobros_gym_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cobros_gym_paciente_gym_id_periodo_mes_periodo_anio_key" ON "cobros_gym"("paciente_gym_id", "periodo_mes", "periodo_anio");

-- Foreign keys
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes_kine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cobros_kine" ADD CONSTRAINT "cobros_kine_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "turnos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cobros_kine" ADD CONSTRAINT "cobros_kine_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "pacientes_kine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_paciente_gym_id_fkey" FOREIGN KEY ("paciente_gym_id") REFERENCES "pacientes_gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "rutinas" ADD CONSTRAINT "rutinas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ejercicios_rutina" ADD CONSTRAINT "ejercicios_rutina_rutina_id_fkey" FOREIGN KEY ("rutina_id") REFERENCES "rutinas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ejercicios_rutina" ADD CONSTRAINT "ejercicios_rutina_ejercicio_id_fkey" FOREIGN KEY ("ejercicio_id") REFERENCES "biblioteca_ejercicios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "asistencias_gym" ADD CONSTRAINT "asistencias_gym_paciente_gym_id_fkey" FOREIGN KEY ("paciente_gym_id") REFERENCES "pacientes_gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cobros_gym" ADD CONSTRAINT "cobros_gym_paciente_gym_id_fkey" FOREIGN KEY ("paciente_gym_id") REFERENCES "pacientes_gym"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Usuarios iniciales
INSERT INTO "usuarios" (id, nombre, email, password_hash, rol, activo, creado_en, actualizado_en) VALUES
  ('usr_jimena_01', 'Jimena', 'jimena@kineapp.com', '$2b$12$rc0x14B9dmp8QKMejTX0u.8VC1ws5ijHXAXGok0Esg7bP.5hqbr12', 'ADMIN', true, NOW(), NOW()),
  ('usr_asistente_01', 'Asistente', 'asistente@kineapp.com', '$2b$12$PUHpbcXNaO1mAEuuj0kpP.W1benKsvDAg7z4Qth8OGYT0M/TTw3UW', 'ASISTENTE', true, NOW(), NOW());
