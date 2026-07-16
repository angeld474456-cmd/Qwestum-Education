import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    logged_out?: string | string[];
  }>;
};

type LoginFeedback = {
  message?: string;
  messageTone?: "success" | "error";
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getLoginFeedback(searchParams: Awaited<NonNullable<LoginPageProps["searchParams"]>>): LoginFeedback {
  if (getFirstParam(searchParams.logged_out) === "1") {
    return {
      message: "You have been signed out.",
      messageTone: "success",
    };
  }

  switch (getFirstParam(searchParams.error)) {
    case "missing_auth_code":
      return {
        message: "The login link is incomplete. Request a new sign-in link.",
        messageTone: "error",
      };
    case "auth_callback_failed":
      return {
        message: "The login link could not be verified. Request a new sign-in link.",
        messageTone: "error",
      };
    case "logout_failed":
      return {
        message: "Sign out could not be completed. Please try again.",
        messageTone: "error",
      };
    default:
      return {};
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const feedback = getLoginFeedback((await searchParams) ?? {});

  return (
    <main className="min-h-screen bg-[#070B14]">

      <div className="grid lg:grid-cols-2 min-h-screen">

        {/* Левая часть */}

        <section className="hidden lg:flex flex-col justify-center px-20 bg-gradient-to-br from-violet-700 via-[#10192D] to-[#070B14]">

          <h1 className="text-6xl font-black text-white">
            Questum
          </h1>

          <p className="text-2xl text-slate-300 mt-6 leading-relaxed">
            Создавайте современные образовательные квесты
            с помощью искусственного интеллекта.
          </p>

          <div className="grid grid-cols-2 gap-6 mt-16">

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">300+</p>
              <p className="text-slate-300 mt-3">
                Готовых квестов
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">AI</p>
              <p className="text-slate-300 mt-3">
                Генерация уроков
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">PDF</p>
              <p className="text-slate-300 mt-3">
                Экспорт материалов
              </p>
            </div>

            <div className="rounded-3xl bg-white/10 p-8 backdrop-blur-xl">
              <p className="text-5xl font-bold text-white">24/7</p>
              <p className="text-slate-300 mt-3">
                Доступ из любой точки мира
              </p>
            </div>

          </div>

        </section>

        {/* Правая часть */}

        <section className="flex items-center justify-center p-10">

          <LoginForm
            message={feedback.message}
            messageTone={feedback.messageTone}
          />

        </section>

      </div>

    </main>
  );
}
