"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/dashboard",
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