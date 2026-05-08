"use client";

import { ArrowRight, Eye, EyeOff, HeartPulse, Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DemoLang, loadDemoLang, saveDemoLang } from "@/lib/demo-language";

const copy = {
  TH: {
    back: "กลับหน้าแรก",
    badge: "Patient onboarding",
    heroTitle: "เริ่มต้นด้วยการเข้าสู่ระบบ",
    heroAccent: "เพื่อเก็บประวัติผู้ป่วยอย่างเป็นระบบ",
    heroBody:
      "หน้านี้เป็นส่วนเริ่มต้นของ flow การใช้งานแอปสุขภาพ หลังจาก login หรือสมัครสมาชิกแล้ว ระบบจะพาไปกรอกข้อมูลพื้นฐานของผู้ป่วยเพื่อใช้ประกอบการประเมินอาการต่อไป",
    card1: "เก็บข้อมูลพื้นฐาน",
    card2: "ฟอร์มพร้อมใช้งาน",
    card3: "Login → Patient Form",
    dataTitle: "ข้อมูลที่จะเก็บต่อจากนี้",
    dataItems: ["อายุและเพศ", "ประวัติผู้ป่วยเบื้องต้น", "ข้อมูลสำหรับคัดกรอง", "ข้อมูลสำหรับการติดตามผล"],
    access: "Account Access",
    login: "เข้าสู่ระบบ",
    register: "สมัครสมาชิก",
    loginSub: "เข้าสู่ระบบเพื่อเริ่มบันทึกประวัติผู้ป่วย",
    registerSub: "สร้างบัญชีเพื่อเริ่มต้นเก็บข้อมูลผู้ป่วยและการติดตามอาการ",
    email: "อีเมล",
    password: "รหัสผ่าน",
    notice: "ไม่ว่าจะกด Login หรือ Register ระบบจะพาไปหน้ากรอกข้อมูลผู้ป่วยถัดไป",
    submitting: "กำลังไปหน้าถัดไป...",
  },
  EN: {
    back: "Back to home",
    badge: "Patient onboarding",
    heroTitle: "Start with account access",
    heroAccent: "to keep patient history in a structured flow",
    heroBody:
      "This page is the starting point of the onboarding flow. After login or registration, the user is taken to the patient profile form before continuing to the assessment steps.",
    card1: "Basic patient data",
    card2: "Ready intake form",
    card3: "Login → Patient Form",
    dataTitle: "Data collected next",
    dataItems: ["Age and gender", "Basic patient history", "Screening details", "Follow-up records"],
    access: "Account Access",
    login: "Login",
    register: "Register",
    loginSub: "Sign in to begin storing patient information",
    registerSub: "Create an account to start patient intake and follow-up flow",
    email: "Email",
    password: "Password",
    notice: "Both Login and Register continue to the patient profile page.",
    submitting: "Continuing...",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<DemoLang>("TH");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLang(loadDemoLang());
  }, []);

  const setLanguage = (value: DemoLang) => {
    setLang(value);
    saveDemoLang(value);
  };

  const t = copy[lang];

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    window.setTimeout(() => router.push("/persona"), 350);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(20,184,166,0.28), transparent 30%), radial-gradient(circle at 80% 22%, rgba(34,211,238,0.22), transparent 28%), linear-gradient(160deg, #07111f 0%, #0f172a 100%)",
            }}
          />
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg">
                <HeartPulse size={20} />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-300">Health Intake</p>
                <p className="text-lg font-bold text-white">Office Relief AI</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <ShieldCheck size={14} className="text-teal-300" />
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-200">{t.badge}</span>
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight text-white">
                {t.heroTitle}
                <span className="mt-2 block text-teal-300">{t.heroAccent}</span>
              </h1>

              <p className="mt-5 max-w-lg text-base font-medium leading-8 text-slate-300">{t.heroBody}</p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <InfoCard title="Patient History" value={t.card1} />
                <InfoCard title="Structured Intake" value={t.card2} />
                <InfoCard title="Flow" value={t.card3} />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-200">{t.dataTitle}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {t.dataItems.map((item) => (
                  <div key={item} className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-xl">
            <div className="flex items-center justify-between gap-4">
              <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
                <ArrowRight size={14} className="rotate-180" />
                {t.back}
              </a>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                {(["TH", "EN"] as DemoLang[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setLanguage(item)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-bold transition",
                      lang === item ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-white/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">{t.access}</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    {mode === "login" ? t.login : t.register}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                    {mode === "login" ? t.loginSub : t.registerSub}
                  </p>
                </div>
                <div className="hidden rounded-3xl bg-teal-50 p-4 text-teal-700 sm:flex">
                  <Lock size={26} />
                </div>
              </div>

              <div className="mt-6 inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold transition",
                    mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
                  )}
                >
                  {t.login}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold transition",
                    mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
                  )}
                >
                  {t.register}
                </button>
              </div>

              <form className="mt-8 space-y-5" onSubmit={submit}>
                <Field label={t.email}>
                  <InputShell icon={<Mail size={16} />}>
                    <input className="w-full bg-transparent outline-none" placeholder="you@example.com" />
                  </InputShell>
                </Field>

                <Field label={t.password}>
                  <InputShell icon={<Lock size={16} />}>
                    <input
                      className="w-full bg-transparent outline-none"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="text-slate-400 transition hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </InputShell>
                </Field>

                <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium leading-6 text-teal-800">
                  {t.notice}
                </div>

                <Button className="h-12 w-full rounded-2xl bg-teal-600 text-base hover:bg-teal-700" disabled={submitting} type="submit">
                  {submitting ? t.submitting : mode === "login" ? t.login : t.register}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function InputShell({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-600 focus-within:border-teal-400 focus-within:bg-white">
      <span className="text-slate-400">{icon}</span>
      {children}
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-200">{title}</p>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}
