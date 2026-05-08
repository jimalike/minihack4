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

const STORAGE_KEY = "office-relief-patient-intake";

type PatientIntake = {
  firstName?: string;
  lastName?: string;
  age: string;
  gender: "male" | "female" | "other";
  workDevice: "desktop" | "laptop" | "tablet";
  workStyle: "sit" | "stand" | "mixed";
  dominantHand: "right" | "left" | "both";
};

type Answer = "yes" | "no" | null;

const SCREENING_QUESTIONS = [
  "ในช่วงนี้คุณมีอาการวิงเวียนศีรษะ ปวดหัว หรือมองไม่ชัด โดยไม่ทราบสาเหตุหรือไม่",
  "คุณรับประทานยาในกลุ่มควบคุมความดัน หรือยาที่เกี่ยวข้องกับโรคหัวใจอยู่หรือไม่",
  "คุณมีอาการเหนื่อยหอบง่าย เจ็บหน้าอก หรือแน่นหน้าอก ระหว่างการขึ้นลงบันไดหรือไม่",
] as const;

export default function AssessmentPage() {
  const router = useRouter();
  const [savedProfile, setSavedProfile] = useState<PatientIntake | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([null, null, null]);
  const [redirecting, setRedirecting] = useState(false);
  const [showRiskPopup, setShowRiskPopup] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setSavedProfile(JSON.parse(raw) as PatientIntake);
    } catch {
      // ignore malformed local data
    }
  }, []);

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
    <div className="min-h-screen bg-[#f4f8fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/persona" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
          <ArrowLeft size={14} />
          กลับไปหน้า Patient Profile
        </a>

        <div className="mt-6 overflow-hidden rounded-[36px] border border-white/80 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 px-8 py-6 sm:px-10">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { step: "1", label: "Login", active: false },
                { step: "2", label: "Patient Profile", active: false },
                { step: "3", label: "Assessment", active: true },
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
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">Screening Gate</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  แบบคัดกรองก่อนเริ่มประเมินอาการ
                </h1>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  เนื่องจากเรายังไม่มีอุปกรณ์สำหรับวัดความดันหรือประเมินภาวะเสี่ยงเฉพาะทางในระบบ
                  จึงต้องมีคำถามคัดกรองก่อนทุกครั้ง หากเข้าข่ายความเสี่ยง ระบบจะไม่พาไปขั้นตอนถัดไป
                </p>
              </div>

              <div className="rounded-3xl bg-white p-4 text-teal-700 shadow-sm">
                <ClipboardCheck size={30} />
              </div>
            </div>
          </div>

          <div className="grid gap-8 px-8 py-8 lg:grid-cols-[1.15fr_0.85fr] sm:px-10">
            <section className="space-y-5">
              <div className="rounded-[32px] bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-6 text-white shadow-[0_24px_80px_rgba(20,184,166,0.28)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <HeartPulse size={22} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/75">Primary Action</p>
                    <h2 className="mt-2 text-2xl font-black">เริ่มตอบคำถามคัดกรอง</h2>
                    <p className="mt-3 text-sm font-medium leading-7 text-white/85">
                      หากตอบว่า “ใช่” ในข้อใดข้อหนึ่ง ระบบจะปฏิเสธไม่ให้ไปขั้นตอนถัดไป และพากลับไปหน้าเดิมเพื่อความปลอดภัย
                    </p>
                  </div>
                </div>
              </div>

              {SCREENING_QUESTIONS.map((question, index) => (
                <QuestionCard
                  answer={answers[index]}
                  index={index}
                  key={question}
                  onAnswer={(value) =>
                    setAnswers((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
                  }
                  question={question}
                />
              ))}

              <div
                className={cn(
                  "rounded-[28px] border p-5",
                  canContinue
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-slate-50",
                )}
              >
                {canContinue ? (
                  <div className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 text-emerald-600" size={20} />
                    <div>
                      <h3 className="text-base font-black text-emerald-700">ผ่านการคัดกรองเบื้องต้น</h3>
                      <p className="mt-2 text-sm font-medium leading-7 text-emerald-700">
                        สามารถไปขั้นตอนถัดไปของการประเมินอาการได้
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-base font-black text-slate-800">รอคำตอบให้ครบทั้ง 3 ข้อ</h3>
                    <p className="mt-2 text-sm font-medium leading-7 text-slate-600">
                      เมื่อคุณตอบครบ ระบบจะสรุปให้ทันทีว่าสามารถไปขั้นตอนต่อไปได้หรือไม่
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-2xl bg-teal-600 px-6 hover:bg-teal-700" disabled={!canContinue}>
                  <a href="/persona">
                    ไปขั้นตอนถัดไป
                    <ArrowRight size={16} />
                  </a>
                </Button>
                <Button asChild className="h-12 rounded-2xl px-6" variant="outline">
                  <a href="/persona">กลับไปหน้าเดิม</a>
                </Button>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Quick Summary</p>
                <div className="mt-4 space-y-3">
                  <SummaryItem label="ชื่อผู้ป่วย" value={patientName} />
                  <SummaryItem label="อายุ" value={savedProfile?.age || "-"} />
                  <SummaryItem label="อุปกรณ์หลัก" value={savedProfile ? deviceText(savedProfile.workDevice) : "-"} />
                  <SummaryItem label="ลักษณะงาน" value={savedProfile ? workStyleText(savedProfile.workStyle) : "-"} />
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">เงื่อนไขการปฏิเสธ</p>
                <p className="mt-3 text-sm font-medium leading-7 text-amber-900">
                  ถ้าผู้ใช้มีอาการตามคำถามคัดกรอง หรือมีประวัติใช้ยาที่เกี่ยวข้องกับความดันและโรคหัวใจ
                  เราจะไม่พาไปขั้นตอนประเมินอาการต่อ เพราะยังไม่มีอุปกรณ์ในระบบสำหรับคัดแยกความเสี่ยงกลุ่มนี้
                </p>
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
                <h2 className="text-xl font-black text-rose-700">ไม่สามารถไปขั้นตอนถัดไปได้</h2>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
                  พบคำตอบที่เข้าข่ายความเสี่ยงจากแบบคัดกรอง ระบบจะหยุด flow การประเมินไว้ก่อน
                  และพากลับไปหน้าแรกสุด
                </p>
                {redirecting ? (
                  <p className="mt-3 text-sm font-bold text-rose-700">กำลังกลับไปหน้าแรกใน 10 วินาที...</p>
                ) : null}
                <div className="mt-5">
                  <Button
                    className="h-11 rounded-2xl bg-rose-600 px-5 hover:bg-rose-700"
                    onClick={() => router.push("/")}
                    type="button"
                  >
                    กลับหน้าแรก
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
}: {
  index: number;
  question: string;
  answer: Answer;
  onAnswer: (value: Answer) => void;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-600">Question {index + 1}</p>
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
          ใช่
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
          ไม่ใช่
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

function deviceText(value: PatientIntake["workDevice"]) {
  if (value === "desktop") return "Desktop";
  if (value === "laptop") return "Laptop";
  return "Tablet";
}

function workStyleText(value: PatientIntake["workStyle"]) {
  if (value === "sit") return "นั่งหน้าจอต่อเนื่อง";
  if (value === "stand") return "ยืนทำงานเป็นหลัก";
  return "เดินสลับนั่ง";
}
