"use client";

import { ArrowLeft, ClipboardList, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "office-relief-patient-intake";

type Gender = "male" | "female" | "other";
type PatientIntake = {
  firstName: string;
  lastName: string;
  age: string;
  gender: Gender;
};

export default function PersonaPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const defaultForm: PatientIntake = {
    firstName: "",
    lastName: "",
    age: "",
    gender: "female",
  };
  const [form, setForm] = useState<PatientIntake>(defaultForm);
  const [savedProfile, setSavedProfile] = useState<PatientIntake | null>(null);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<PatientIntake>;
      const hydrated: PatientIntake = {
        firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
        lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
        age: typeof parsed.age === "string" ? parsed.age : "",
        gender: parsed.gender === "male" || parsed.gender === "female" || parsed.gender === "other" ? parsed.gender : "female",
      };
      setForm(hydrated);
      setSavedProfile(hydrated);
      setSaveMessage("โหลดข้อมูลที่เคยบันทึกไว้แล้ว");
    } catch {
      // ignore corrupted local data
    }
  }, []);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSavedProfile(form);
    setSaveMessage("บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว");
    window.setTimeout(() => setSaving(false), 350);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
              <ArrowLeft size={14} />
              กลับไปหน้า login
            </a>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">Patient Intake</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              ระบุข้อมูลพื้นฐานของผู้ป่วย
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">
              หน้านี้เป็น mockup สำหรับเก็บข้อมูลตั้งต้นก่อนเริ่มประเมินอาการจริง ข้อมูลที่กรอกจะช่วยให้ระบบตีความอาการได้เหมาะสมขึ้น
            </p>
            {saveMessage ? (
              <p className="mt-3 inline-flex rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                {saveMessage}
              </p>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <ClipboardList size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Mockup Flow</p>
                <p className="text-sm font-bold text-slate-900">Login / Register → Patient Profile</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={submit} className="rounded-[32px] border border-white/80 bg-white/92 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm sm:p-8">
            <div className="grid gap-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="ชื่อ">
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-teal-400 focus:bg-white"
                    onChange={(event) => update("firstName", event.target.value)}
                    placeholder="เช่น สุพนัต"
                    value={form.firstName}
                  />
                </Field>

                <Field label="นามสกุล">
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-teal-400 focus:bg-white"
                    onChange={(event) => update("lastName", event.target.value)}
                    placeholder="เช่น ใจดี"
                    value={form.lastName}
                  />
                </Field>
              </div>

              <Field label="อายุ">
                <input
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-teal-400 focus:bg-white"
                  inputMode="numeric"
                  onChange={(event) => update("age", event.target.value)}
                  placeholder="เช่น 28"
                  value={form.age}
                />
              </Field>

              <Field label="เพศ">
                <div className="grid gap-3 sm:grid-cols-3">
                  <ChoiceCard active={form.gender === "male"} label="ชาย" onClick={() => update("gender", "male")} />
                  <ChoiceCard active={form.gender === "female"} label="หญิง" onClick={() => update("gender", "female")} />
                  <ChoiceCard active={form.gender === "other"} label="อื่น ๆ" onClick={() => update("gender", "other")} />
                </div>
              </Field>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 rounded-2xl bg-teal-600 px-6 text-base hover:bg-teal-700" disabled={saving} type="submit">
                <Save size={16} />
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </Button>
              <Button
                className="h-12 rounded-2xl px-6"
                disabled={!savedProfile}
                onClick={() => router.push("/assessment")}
                type="button"
                variant="outline"
              >
                ไปหน้าถัดไป
              </Button>
              <Button asChild className="h-12 rounded-2xl px-6" type="button" variant="outline">
                <a href="/">กลับหน้าแรก</a>
              </Button>
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                  <UserRound size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Patient Summary</p>
                  <p className="text-sm font-bold text-slate-900">
                    {savedProfile ? "ข้อมูลที่บันทึกไว้ล่าสุด" : "ยังไม่มีข้อมูลที่บันทึก"}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SummaryItem label="ชื่อ" value={savedProfile?.firstName || "-"} />
                <SummaryItem label="นามสกุล" value={savedProfile?.lastName || "-"} />
                <SummaryItem label="อายุ" value={savedProfile?.age || "-"} />
                <SummaryItem label="เพศ" value={savedProfile ? genderText(savedProfile.gender) : "-"} />
              </div>
            </div>

            <div className="rounded-[32px] border border-teal-100 bg-teal-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">หมายเหตุ</p>
              <p className="mt-3 text-sm font-medium leading-7 text-teal-900">
                ตอนนี้เป็น mockup ดังนั้นเมื่อกดบันทึก ระบบจะเก็บข้อมูลไว้ในเครื่องก่อน และเมื่อพร้อมแล้วสามารถกด
                `ไปหน้าถัดไป` เพื่อดู flow ของหน้าถัดไปได้เลย
              </p>
            </div>
          </aside>
        </div>
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

function ChoiceCard({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm font-bold transition",
        active ? "border-teal-500 bg-teal-50 text-teal-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
      )}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function genderText(value: Gender) {
  if (value === "male") return "ชาย";
  if (value === "female") return "หญิง";
  return "อื่น ๆ";
}
