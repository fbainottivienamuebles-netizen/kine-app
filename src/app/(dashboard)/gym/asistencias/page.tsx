export default function AsistenciasPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Asistencias hoy</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <p className="text-gray-400">Registro de asistencias diarias — Fase 5</p>
      </div>
    </div>
  );
}
