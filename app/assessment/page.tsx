"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DemoLang, loadDemoLang, saveDemoLang } from "@/lib/demo-language";

const STORAGE_KEY = "office-relief-patient-intake";

type PatientIntake = {
  firstName?: string;
  lastName?: string;
  age: string;
  gender: "male" | "female" | "other";
};

type Answer = "yes" | "no" | null;

const copy = {
  TH: {
    back: "กลับไปหน้า Patient Profile",
    eyebrow: "Screening Gate",
    title: "แบบคัดกรองก่อนเริ่มประเมินอาการ",
    body:
      "เนื่องจากเรายังไม่มีอุปกรณ์สำหรับวัดความดันหรือประเมินภาวะเสี่ยงเฉพาะทางในระบบ จึงต้องมีคำถามคัดกรองก่อนทุกครั้ง หากเข้าข่ายความเสี่ยง ระบบจะไม่พาไปขั้นตอนถัดไป",
    primary: "Primary Action",
    primaryTitle: "เริ่มตอบคำถามคัดกรอง",
    primaryBody:
      "หากตอบว่า “ใช่” ในข้อใดข้อหนึ่ง ระบบจะปฏิเสธไม่ให้ไปขั้นตอนถัดไป และพากลับไปหน้าแรกเพื่อความปลอดภัย",
    step1: "Login",
    step2: "Patient Profile",
    step3: "Assessment",
    waitingTitle: "รอคำตอบให้ครบทั้ง 3 ข้อ",
    waitingBody: "เมื่อคุณตอบครบ ระบบจะสรุปให้ทันทีว่าสามารถไปขั้นตอนต่อไปได้หรือไม่",
    passTitle: "ผ่านการคัดกรองเบื้องต้น",
    passBody: "สามารถไปขั้นตอนถัดไปของการประเมินอาการได้",
    next: "ไปขั้นตอนถัดไป",
    previous: "กลับไปหน้าเดิม",
    summary: "Quick Summary",
    patientName: "ชื่อผู้ป่วย",
    age: "อายุ",
    gender: "เพศ",
    rejectTitle: "เงื่อนไขการปฏิเสธ",
    rejectBody:
      "ถ้าผู้ใช้มีอาการตามคำถามคัดกรอง หรือมีประวัติใช้ยาที่เกี่ยวข้องกับความดันและโรคหัวใจ เราจะไม่พาไปขั้นตอนประเมินอาการต่อ เพราะยังไม่มีอุปกรณ์ในระบบสำหรับคัดแยกความเสี่ยงกลุ่มนี้",
    popupTitle: "ไม่สามารถไปขั้นตอนถัดไปได้",
    popupBody: "พบคำตอบที่เข้าข่ายความเสี่ยงจากแบบคัดกรอง ระบบจะหยุด flow การประเมินไว้ก่อน และพากลับไปหน้าแรกสุด",
    popupCountdown: "กำลังกลับไปหน้าแรกใน 10 วินาที...",
    popupButton: "กลับหน้าแรก",
    yes: "ใช่",
    no: "ไม่ใช่",
    question: "Question",
    q1: "ในช่วงนี้คุณมีอาการวิงเวียนศีรษะ ปวดหัว หรือมองไม่ชัด โดยไม่ทราบสาเหตุหรือไม่",
    q2: "คุณรับประทานยาในกลุ่มควบคุมความดัน หรือยาที่เกี่ยวข้องกับโรคหัวใจอยู่หรือไม่",
    q3: "คุณมีอาการเหนื่อยหอบง่าย เจ็บหน้าอก หรือแน่นหน้าอก ระหว่างการขึ้นลงบันไดหรือไม่",
  },
  EN: {
    back: "Back to Patient Profile",
    eyebrow: "Screening Gate",
    title: "Pre-screening before the assessment starts",
    body:
      "Because the current demo does not include blood-pressure devices or specialized screening tools, these basic safety questions must be answered first. If a risk answer appears, the user cannot continue.",
    primary: "Primary Action",
    primaryTitle: "Answer the screening questions",
    primaryBody:
      "If the user answers “Yes” to any item, the system blocks the next step and returns to the home page for safety.",
    step1: "Login",
    step2: "Patient Profile",
    step3: "Assessment",
    waitingTitle: "Please answer all 3 questions",
    waitingBody: "Once all answers are complete, the system will immediately determine whether the flow can continue.",
    passTitle: "Passed the initial screening",
    passBody: "You can continue to the next assessment step.",
    next: "Continue",
    previous: "Go back",
    summary: "Quick Summary",
    patientName: "Patient name",
    age: "Age",
    gender: "Gender",
    rejectTitle: "Rejection Rule",
    rejectBody:
      "If the user reports these symptoms or uses medication related to blood pressure or heart disease, the demo should stop here because the system does not yet include the tools required to safely triage that group.",
    popupTitle: "Cannot continue to the next step",
    popupBody: "A risk-related answer was found in the screening form. The assessment flow will stop here and return to the home page.",
    popupCountdown: "Returning to home in 10 seconds...",
    popupButton: "Back to home",
    yes: "Yes",
    no: "No",
    question: "Question",
    q1: "Have you recently had dizziness, headaches, or blurred vision without a clear cause?",
    q2: "Are you currently taking blood pressure medication or medication related to heart disease?",
    q3: "Do you get easily short of breath, chest pain, or chest tightness while going up or down stairs?",
  },
} as const;

export default function AssessmentPage() {
  const router = useRouter();
  const [lang, setLang] = useState<DemoLang>("TH");
  const [savedProfile, setSavedProfile] = useState<PatientIntake | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([null, null, null]);
  const [redirecting, setRedirecting] = useState(false);
  const [showRiskPopup, setShowRiskPopup] = useState(false);

  useEffect(() => {
    setLang(loadDemoLang());
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<PatientIntake>;
      setSavedProfile({
        firstName: typeof parsed.firstName === "string" ? parsed.firstName : "",
        lastName: typeof parsed.lastName === "string" ? parsed.lastName : "",
        age: typeof parsed.age === "string" ? parsed.age : "",
        gender:
          parsed.gender === "male" || parsed.gender === "female" || parsed.gender === "other"
            ? parsed.gender
            : "female",
      });
    } catch {
      // ignore malformed local data
    }
  }, []);

  const setLanguage = (value: DemoLang) => {
    setLang(value);
    saveDemoLang(value);
  };

  const t = copy[lang];
  const questions = [t.q1, t.q2, t.q3];

  const allAnswered = answers.every((answer) => answer !== null);
  const hasRiskAnswer = answers.some((answer) => answer === "yes");
  const canContinue = allAnswered && !hasRiskAnswer;

  useEffect(() => {
    if (!hasRiskAnswer) return;
    setShowRiskPopup(true);
    setRedirecting(true);
    const timer = window.setTimeout(() => {
      router.push("/");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [hasRiskAnswer, router]);

  const patientName = useMemo(() => {
    if (!savedProfile) return "-";
    const fullName = [savedProfile.firstName, savedProfile.lastName].filter(Boolean).join(" ").trim();
    return fullName || "-";
  }, [savedProfile]);

  return (
    <div className="min-h-screen bg-[#f4f8fb] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/persona"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800"
          >
            <ArrowLeft size={14} />
            {t.back}
          </a>
          <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white p-1 shadow-sm sm:self-auto">
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

        <div className="mt-6 overflow-hidden rounded-[28px] border border-white/80 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm sm:rounded-[36px]">
          <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 px-5 py-5 sm:px-10 sm:py-6">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { step: "1", label: t.step1, active: false },
                { step: "2", label: t.step2, active: false },
                { step: "3", label: t.step3, active: true },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold",
                      item.active ? "bg-teal-600 text-white" : "border border-slate-200 bg-white text-slate-600",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                        item.active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {item.step}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {index < 2 ? <div className="hidden h-px w-6 bg-slate-200 sm:block" /> : null}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">{t.eyebrow}</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">{t.title}</h1>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600 sm:text-base">{t.body}</p>
              </div>

              <div className="rounded-3xl bg-white p-4 text-teal-700 shadow-sm">
                <ClipboardCheck size={30} />
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-10 sm:py-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-8">
            <section className="space-y-5">
              <div className="rounded-[32px] bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-6 text-white shadow-[0_24px_80px_rgba(20,184,166,0.28)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <HeartPulse size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/75">{t.primary}</p>
                    <h2 className="mt-2 text-2xl font-black">{t.primaryTitle}</h2>
                    <p className="mt-3 text-sm font-medium leading-7 text-white/85">{t.primaryBody}</p>
                  </div>
                </div>
              </div>

              {questions.map((question, index) => (
                <QuestionCard
                  answer={answers[index]}
                  index={index}
                  key={question}
                  lang={lang}
                  onAnswer={(value) =>
                    setAnswers((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
                  }
                  question={question}
                />
              ))}

              <div
                className={cn(
                  "rounded-[28px] border p-5",
                  canContinue ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
                )}
              >
                {canContinue ? (
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} />
                    <div>
                      <h3 className="text-base font-black text-emerald-700">{t.passTitle}</h3>
                      <p className="mt-2 text-sm font-medium leading-7 text-emerald-700">{t.passBody}</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-black text-slate-800">{t.waitingTitle}</h3>
                    <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{t.waitingBody}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-2xl bg-teal-600 px-6 hover:bg-teal-700" disabled={!canContinue}>
                  <a href="/body-map">
                    {t.next}
                    <ArrowRight size={16} />
                  </a>
                </Button>
                <Button asChild className="h-12 rounded-2xl px-6" variant="outline">
                  <a href="/persona">{t.previous}</a>
                </Button>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.summary}</p>
                <div className="mt-4 space-y-3">
                  <SummaryItem label={t.patientName} value={patientName} />
                  <SummaryItem label={t.age} value={savedProfile?.age || "-"} />
                  <SummaryItem label={t.gender} value={savedProfile ? genderText(savedProfile.gender, lang) : "-"} />
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">{t.rejectTitle}</p>
                <p className="mt-3 text-sm font-medium leading-7 text-amber-900">{t.rejectBody}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showRiskPopup ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-rose-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-black text-rose-700">{t.popupTitle}</h2>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-700">{t.popupBody}</p>
                {redirecting ? <p className="mt-3 text-sm font-bold text-rose-700">{t.popupCountdown}</p> : null}
                <div className="mt-5">
                  <Button
                    className="h-11 rounded-2xl bg-rose-600 px-5 hover:bg-rose-700"
                    onClick={() => router.push("/")}
                    type="button"
                  >
                    {t.popupButton}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QuestionCard({
  index,
  question,
  answer,
  onAnswer,
  lang,
}: {
  index: number;
  question: string;
  answer: Answer;
  onAnswer: (value: Answer) => void;
  lang: DemoLang;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-600">
        {lang === "TH" ? "คำถาม" : "Question"} {index + 1}
      </p>
      <h2 className="mt-3 text-lg font-black leading-8 text-slate-900">{question}</h2>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          className={cn(
            "rounded-2xl border px-5 py-3 text-sm font-bold transition",
            answer === "yes"
              ? "border-rose-500 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-200 hover:bg-rose-50/60",
          )}
          onClick={() => onAnswer("yes")}
          type="button"
        >
          {lang === "TH" ? "ใช่" : "Yes"}
        </button>
        <button
          className={cn(
            "rounded-2xl border px-5 py-3 text-sm font-bold transition",
            answer === "no"
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/60",
          )}
          onClick={() => onAnswer("no")}
          type="button"
        >
          {lang === "TH" ? "ไม่ใช่" : "No"}
        </button>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function genderText(value: PatientIntake["gender"], lang: DemoLang) {
  if (lang === "EN") {
    if (value === "male") return "Male";
    if (value === "female") return "Female";
    return "Other";
  }
  if (value === "male") return "ชาย";
  if (value === "female") return "หญิง";
  return "อื่น ๆ";
}
