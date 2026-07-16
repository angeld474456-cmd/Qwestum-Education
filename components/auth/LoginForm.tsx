"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type LoginFormProps = {
  message?: string;
  messageTone?: "success" | "error";
};

export default function LoginForm({
  message,
  messageTone = "success",
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const callbackUrl = `${window.location.origin}/auth/callback?next=/dashboard`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Письмо для входа отправлено!");
    }

    setLoading(false);
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 p-10 shadow-2xl">

      <div className="text-center mb-8">
        <h1 className="text-5xl font-black text-white">
          Questum
        </h1>

        <p className="text-slate-300 mt-3">
          Платформа образовательных квестов
        </p>
      </div>

      <input
        type="email"
        placeholder="Введите Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-2xl bg-white/20 border border-white/20 px-5 py-4 text-white placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-violet-500"
      />

      {message ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            messageTone === "error"
              ? "border-red-400/40 bg-red-500/10 text-red-100"
              : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100"
          }`}
        >
          {message}
        </div>
      ) : null}

      <button
        onClick={signIn}
        disabled={loading}
        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 py-4 text-lg font-bold text-white transition hover:scale-105"
      >
        {loading ? "Отправка..." : "Продолжить"}
      </button>

      <p className="mt-6 text-center text-sm text-slate-300">
        Безопасный вход через Supabase
      </p>

    </div>
  );
}
