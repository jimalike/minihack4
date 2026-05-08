"use client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-200">
                  Mockup patient onboarding
                </span>
              </div>

              <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight text-white">
                เริ่มต้นด้วยการเข้าสู่ระบบ
                <span className="mt-2 block text-teal-300">เพื่อเก็บประวัติผู้ป่วยอย่างเป็นระบบ</span>
              </h1>

              <p className="mt-5 max-w-lg text-base font-medium leading-8 text-slate-300">
                หน้านี้เป็น mockup สำหรับ flow การใช้งานจริงของแอปสุขภาพ หลังจาก login หรือสมัครสมาชิกแล้ว
                ระบบจะพาไปกรอกข้อมูลพื้นฐานของผู้ป่วยเพื่อใช้ประกอบการประเมินอาการต่อไป
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <InfoCard title="Patient History" value="เก็บข้อมูลพื้นฐาน" />
                <InfoCard title="Structured Intake" value="ฟอร์มพร้อมใช้งาน" />
                <InfoCard title="Mock Flow" value="Login → Patient Form" />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-teal-200">ข้อมูลที่จะเก็บต่อจากนี้</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "อายุและเพศ",
                  "อุปกรณ์ทำงานหลัก",
                  "ลักษณะงานและชั่วโมงการทำงาน",
                  "มือข้างที่ถนัด",
                ].map((item) => (
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
            <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
              <ArrowRight size={14} className="rotate-180" />
              กลับหน้าแรก
            </a>

            <div className="mt-6 rounded-[32px] border border-white/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">Account Access</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    {mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
                  </h2>
                  <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                    {mode === "login"
                      ? "เข้าสู่ระบบเพื่อเริ่มบันทึกประวัติผู้ป่วย"
                      : "สร้างบัญชีเพื่อเริ่มต้นเก็บข้อมูลผู้ป่วยและการติดตามอาการ"}
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
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-bold transition",
                    mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500",
                  )}
                >
                  Register
                </button>
              </div>

              <form className="mt-8 space-y-5" onSubmit={submit}>
                <Field label="อีเมล">
                  <InputShell icon={<Mail size={16} />}>
                    <input className="w-full bg-transparent outline-none" placeholder="you@example.com" />
                  </InputShell>
                </Field>

                <Field label="รหัสผ่าน">
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
                  Mockup mode: ไม่ว่าจะกด Login หรือ Register ระบบจะพาไปหน้ากรอกข้อมูลผู้ป่วยถัดไป
                </div>

                <Button className="h-12 w-full rounded-2xl bg-teal-600 text-base hover:bg-teal-700" disabled={submitting} type="submit">
                  {submitting ? "กำลังไปหน้าถัดไป..." : mode === "login" ? "Login" : "Register"}
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
