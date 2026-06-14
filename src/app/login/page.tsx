import { LoginForm } from "@/components/auth/login-form";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💆‍♀️ 🏋️‍♀️</div>
          <h1 className="text-2xl font-bold text-gray-900">KineApp</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kinesiología & Gimnasio de Fuerza
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
