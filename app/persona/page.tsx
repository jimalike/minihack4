"use client";

import { ArrowLeft, ClipboardList, Save, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DemoLang, loadDemoLang, saveDemoLang } from "@/lib/demo-language";

const STORAGE_KEY = "office-relief-patient-intake";

type Gender = "male" | "female" | "other";
type PatientIntake = {
  firstName: string;
  lastName: string;
  age: string;
  gender: Gender;
};

const copy = {
  TH: {
    back: "กลับไปหน้า login",
    eyebrow: "Patient Intake",
    title: "ระบุข้อมูลพื้นฐานของผู้ป่วย",
    body: "หน้านี้ใช้เก็บข้อมูลตั้งต้นก่อนเริ่มประเมินอาการจริง ข้อมูลที่กรอกจะช่วยให้ระบบตีความอาการได้เหมาะสมขึ้น",
    firstName: "ชื่อ",
    firstNamePlaceholder: "เช่น สุพนัต",
    lastName: "นามสกุล",
    lastNamePlaceholder: "เช่น ใจดี",
    age: "อายุ",
    agePlaceholder: "เช่น 28",
    gender: "เพศ",
    male: "ชาย",
    female: "หญิง",
    other: "อื่น ๆ",
    save: "บันทึกข้อมูล",
    saving: "กำลังบันทึก...",
    next: "ไปหน้าถัดไป",
    home: "กลับหน้าแรก",
    summaryTitle: "Patient Summary",
    summarySaved: "ข้อมูลที่บันทึกไว้ล่าสุด",
    summaryEmpty: "ยังไม่มีข้อมูลที่บันทึก",
    noteTitle: "หมายเหตุ",
    noteBody: "เมื่อกดบันทึก ระบบจะเก็บข้อมูลไว้ในเครื่องก่อน และเมื่อพร้อมแล้วสามารถกดไปหน้าถัดไปเพื่อดู flow ของหน้าถัดไปได้เลย",
    loaded: "โหลดข้อมูลที่เคยบันทึกไว้แล้ว",
    saved: "บันทึกข้อมูลผู้ป่วยเรียบร้อยแล้ว",
  },
  EN: {
    back: "Back to login",
    eyebrow: "Patient Intake",
    title: "Enter the patient's basic information",
    body: "This page stores the initial patient profile before the real assessment flow begins. The entered data helps the system interpret symptoms more clearly.",
    firstName: "First name",
    firstNamePlaceholder: "e.g. Supanut",
    lastName: "Last name",
    lastNamePlaceholder: "e.g. Jaidee",
    age: "Age",
    agePlaceholder: "e.g. 28",
    gender: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
    save: "Save profile",
    saving: "Saving...",
    next: "Next step",
    home: "Back to home",
    summaryTitle: "Patient Summary",
    summarySaved: "Latest saved record",
    summaryEmpty: "No saved profile yet",
    noteTitle: "Note",
    noteBody: "When you save, the profile is stored locally first, and you can continue to the next page to review the rest of the demo flow.",
    loaded: "Loaded previously saved profile",
    saved: "Patient profile saved successfully",
  },
} as const;

export default function PersonaPage() {
  const router = useRouter();
  const [lang, setLang] = useState<DemoLang>("TH");
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
    setLang(loadDemoLang());
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
      setSaveMessage(copy[loadDemoLang()].loaded);
    } catch {
      // ignore corrupted local data
    }
  }, []);

  const setLanguage = (value: DemoLang) => {
    setLang(value);
    saveDemoLang(value);
    if (saveMessage) {
      if (saveMessage === copy.TH.loaded || saveMessage === copy.EN.loaded) setSaveMessage(copy[value].loaded);
      if (saveMessage === copy.TH.saved || saveMessage === copy.EN.saved) setSaveMessage(copy[value].saved);
    }
  };

  const t = copy[lang];

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSavedProfile(form);
    setSaveMessage(t.saved);
    window.setTimeout(() => setSaving(false), 350);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <a href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
              <ArrowLeft size={14} />
              {t.back}
            </a>
            <p className="mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">{t.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{t.title}</h1>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600 sm:text-base">{t.body}</p>
            {saveMessage ? (
              <p className="mt-3 inline-flex rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                {saveMessage}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <div className="inline-flex w-fit items-center justify-start gap-2 self-start rounded-full border border-slate-200 bg-white p-1 shadow-sm sm:justify-end sm:self-auto">
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
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={submit} className="rounded-[28px] border border-white/80 bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm sm:rounded-[32px] sm:p-8">
            <div className="grid gap-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label={t.firstName}>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-teal-400 focus:bg-white"
                    onChange={(event) => update("firstName", event.target.value)}
                    placeholder={t.firstNamePlaceholder}
                    value={form.firstName}
                  />
                </Field>

                <Field label={t.lastName}>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-teal-400 focus:bg-white"
                    onChange={(event) => update("lastName", event.target.value)}
                    placeholder={t.lastNamePlaceholder}
                    value={form.lastName}
                  />
                </Field>
              </div>

              <Field label={t.age}>
                <input
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-teal-400 focus:bg-white"
                  inputMode="numeric"
                  onChange={(event) => update("age", event.target.value)}
                  placeholder={t.agePlaceholder}
                  value={form.age}
                />
              </Field>

              <Field label={t.gender}>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ChoiceCard active={form.gender === "male"} label={t.male} onClick={() => update("gender", "male")} />
                  <ChoiceCard active={form.gender === "female"} label={t.female} onClick={() => update("gender", "female")} />
                  <ChoiceCard active={form.gender === "other"} label={t.other} onClick={() => update("gender", "other")} />
                </div>
              </Field>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button className="h-12 rounded-2xl bg-teal-600 px-6 text-base hover:bg-teal-700" disabled={saving} type="submit">
                <Save size={16} />
                {saving ? t.saving : t.save}
              </Button>
              <Button
                className="h-12 rounded-2xl px-6"
                disabled={!savedProfile}
                onClick={() => router.push("/assessment")}
                type="button"
                variant="outline"
              >
                {t.next}
              </Button>
              <Button asChild className="h-12 rounded-2xl px-6" type="button" variant="outline">
                <a href="/">{t.home}</a>
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
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.summaryTitle}</p>
                  <p className="text-sm font-bold text-slate-900">
                    {savedProfile ? t.summarySaved : t.summaryEmpty}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <SummaryItem label={t.firstName} value={savedProfile?.firstName || "-"} />
                <SummaryItem label={t.lastName} value={savedProfile?.lastName || "-"} />
                <SummaryItem label={t.age} value={savedProfile?.age || "-"} />
                <SummaryItem label={t.gender} value={savedProfile ? genderText(savedProfile.gender, lang) : "-"} />
              </div>
            </div>

            <div className="rounded-[32px] border border-teal-100 bg-teal-50 p-6">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">{t.noteTitle}</p>
              <p className="mt-3 text-sm font-medium leading-7 text-teal-900">{t.noteBody}</p>
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

function genderText(value: Gender, lang: DemoLang) {
  if (lang === "EN") {
    if (value === "male") return "Male";
    if (value === "female") return "Female";
    return "Other";
  }

  if (value === "male") return "ชาย";
  if (value === "female") return "หญิง";
  return "อื่น ๆ";
}
