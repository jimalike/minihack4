"use client";

import { Activity, ArrowLeft, CheckCircle2, ClipboardList, HeartPulse, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DemoLang, loadDemoLang, saveDemoLang } from "@/lib/demo-language";

const BODY_MAP_STORAGE_KEY = "office-relief-body-map";
const PATIENT_STORAGE_KEY = "office-relief-patient-intake";
const CARD_ONE_VIDEO_SRC = "/videos/card-1-demo.mp4";
const CARD_TWO_VIDEO_SRC = "/videos/card-2-demo.mp4";
const CARD_THREE_VIDEO_SRC = "/videos/card-3-demo.mp4";

type BodyZoneId =
  | "front-shoulder-left"
  | "front-shoulder-right"
  | "front-chest"
  | "front-arm-left"
  | "front-arm-right"
  | "front-wrist-left"
  | "front-wrist-right"
  | "front-thigh-left"
  | "front-thigh-right"
  | "front-knee-left"
  | "front-knee-right"
  | "back-neck"
  | "back-shoulder-left"
  | "back-shoulder-right"
  | "back-upper-back"
  | "back-lower-back"
  | "back-arm-left"
  | "back-arm-right"
  | "back-glute-left"
  | "back-glute-right"
  | "back-thigh-left"
  | "back-thigh-right"
  | "back-calf-left"
  | "back-calf-right";

type PatientIntake = {
  firstName: string;
  lastName: string;
  age: string;
  gender: "male" | "female" | "other";
};

const zoneLabels: Record<BodyZoneId, Record<DemoLang, string>> = {
  "front-shoulder-left": { TH: "ไหล่ซ้ายด้านหน้า", EN: "Front left shoulder" },
  "front-shoulder-right": { TH: "ไหล่ขวาด้านหน้า", EN: "Front right shoulder" },
  "front-chest": { TH: "หน้าอก", EN: "Chest" },
  "front-arm-left": { TH: "แขนซ้ายด้านหน้า", EN: "Front left arm" },
  "front-arm-right": { TH: "แขนขวาด้านหน้า", EN: "Front right arm" },
  "front-wrist-left": { TH: "ข้อมือซ้าย", EN: "Left wrist" },
  "front-wrist-right": { TH: "ข้อมือขวา", EN: "Right wrist" },
  "front-thigh-left": { TH: "ต้นขาซ้ายด้านหน้า", EN: "Front left thigh" },
  "front-thigh-right": { TH: "ต้นขาขวาด้านหน้า", EN: "Front right thigh" },
  "front-knee-left": { TH: "เข่าซ้าย", EN: "Left knee" },
  "front-knee-right": { TH: "เข่าขวา", EN: "Right knee" },
  "back-neck": { TH: "คอด้านหลัง", EN: "Back of neck" },
  "back-shoulder-left": { TH: "ไหล่ซ้ายด้านหลัง", EN: "Back left shoulder" },
  "back-shoulder-right": { TH: "ไหล่ขวาด้านหลัง", EN: "Back right shoulder" },
  "back-upper-back": { TH: "หลังส่วนบน", EN: "Upper back" },
  "back-lower-back": { TH: "หลังส่วนล่าง", EN: "Lower back" },
  "back-arm-left": { TH: "แขนซ้ายด้านหลัง", EN: "Back left arm" },
  "back-arm-right": { TH: "แขนขวาด้านหลัง", EN: "Back right arm" },
  "back-glute-left": { TH: "สะโพกซ้าย", EN: "Left glute" },
  "back-glute-right": { TH: "สะโพกขวา", EN: "Right glute" },
  "back-thigh-left": { TH: "ต้นขาซ้ายด้านหลัง", EN: "Back left thigh" },
  "back-thigh-right": { TH: "ต้นขาขวาด้านหลัง", EN: "Back right thigh" },
  "back-calf-left": { TH: "น่องซ้าย", EN: "Left calf" },
  "back-calf-right": { TH: "น่องขวา", EN: "Right calf" },
};

const copy = {
  TH: {
    back: "กลับไปหน้า Body Map",
    eyebrow: "Result",
    title: "ผลวิเคราะห์เบื้องต้น",
    headlineTop: "มีความเสี่ยงต่อ",
    headlineMain: "ออฟฟิศซินโดรม",
    intro: "จากข้อมูลอาการและบริเวณที่คุณระบุ ระบบได้สรุปผลเบื้องต้นเพื่อใช้ประกอบการดูแลตัวเองต่อ",
    introFallback: "ระบบได้สรุปผลเบื้องต้นจากข้อมูลที่กรอกไว้ เพื่อใช้ประกอบการดูแลตัวเองต่อ",
    therapyTitle: "เราได้ออกแบบท่ากายภาพให้กับคุณไว้ดังนี้",
    summary: "สรุปข้อมูลที่ใช้ประกอบการประเมิน",
    selectedAreas: "บริเวณที่คุณระบุว่ามีอาการ",
    noAreas: "ยังไม่มีข้อมูลตำแหน่งที่ปวดจากหน้า Body Map",
    riskTitle: "ระดับความเสี่ยงเบื้องต้น",
    riskValue: "ควรเริ่มดูแลและติดตามอาการ",
    riskBody:
      "คำแนะนำในขั้นต้นเป็นเพียงการกายบริหารเบื้องต้น ไม่ใช่วิธีในการรักษา แนะนำให้ไปพบผู้เชี่ยวชาญในการรักษา",
    exercises: [
      {
        title: "เอียงศีรษะไปด้านข้าง",
        body: "ใช้มือช่วยดึงยืด ทำสลับซ้ายขวา ค้าง 10 วินาที ทำ 5 รอบ",
      },
      {
        title: "ยืดแขนไปฝั่งตรงข้าม",
        body: "ใช้มือช่วยดึงยืด ทำสลับซ้ายขวา ค้าง 10 วินาที ทำ 5 รอบ",
      },
      {
        title: "ประสานมือแล้วยืดแขนขึ้นด้านบน",
        body: "ให้รู้สึกตึงช่วงหัวไหล่ ค้าง 10 วินาที ทำ 5 รอบ",
      },
      {
        title: "ยืดหลังและสะบัก",
        body: "เหมาะสำหรับใส่วิดีโอสาธิตการยืดหลังส่วนบนและสะบักในขั้นถัดไป",
      },
    ],
    videoReady: "พื้นที่สำหรับวิดีโอท่ากายภาพ",
    nextTitle: "สิ่งที่ควรทำต่อ",
    nextItems: ["สังเกตว่าปวดลดลงหรือไม่หลังพักและยืดเบา ๆ", "ถ้าอาการปวดต่อเนื่องหรือมากขึ้น ควรปรึกษาผู้เชี่ยวชาญด้านสุขภาพ", "ใช้ผลหน้านี้เป็นตัวอย่างผลวินิจฉัยเบื้องต้นจากเอเจนท์"],
    restart: "กลับไปเลือกตำแหน่งใหม่",
    home: "กลับหน้าแรก",
    patientLabel: "ผู้ใช้งาน",
    ageLabel: "อายุ",
    genderLabel: "เพศ",
    male: "ชาย",
    female: "หญิง",
    other: "อื่น ๆ",
  },
  EN: {
    back: "Back to Body Map",
    eyebrow: "Result",
    title: "Preliminary result",
    headlineTop: "Potential risk of",
    headlineMain: "OFFICE SYNDROME",
    intro: "Based on your reported symptoms and selected pain areas, the system prepared a preliminary summary to support your next steps.",
    introFallback: "The system prepared a preliminary summary from the information you provided to support your next steps.",
    therapyTitle: "We have prepared these physical therapy poses for you:",
    summary: "Summary used for this preliminary assessment",
    selectedAreas: "Reported pain areas",
    noAreas: "No pain areas were saved from the Body Map yet",
    riskTitle: "Initial risk level",
    riskValue: "Start self-care and keep monitoring symptoms",
    riskBody:
      "These early suggestions are only basic exercise guidance and are not a treatment method. Please consult a qualified specialist for treatment.",
    exercises: [
      {
        title: "Side neck tilt stretch",
        body: "Use your hand to assist the stretch. Alternate left and right, hold for 10 seconds, repeat 5 times.",
      },
      {
        title: "Cross-body arm stretch",
        body: "Use the opposite hand to assist the stretch. Alternate left and right, hold for 10 seconds, repeat 5 times.",
      },
      {
        title: "Hands clasped overhead stretch",
        body: "Raise both arms overhead until you feel tension around the shoulders. Hold for 10 seconds, repeat 5 times.",
      },
      {
        title: "Upper back and scapular stretch",
        body: "Reserved for a future demo video showing an upper back and scapular stretch.",
      },
    ],
    videoReady: "Space reserved for future exercise video",
    nextTitle: "Recommended next steps",
    nextItems: ["Observe whether pain improves after rest and gentle stretching", "Consult a health professional if symptoms continue or worsen", "Use this page as a sample preliminary result from the agent"],
    restart: "Choose pain areas again",
    home: "Back to home",
    patientLabel: "User",
    ageLabel: "Age",
    genderLabel: "Gender",
    male: "Male",
    female: "Female",
    other: "Other",
  },
} as const;

export default function ResultPage() {
  const [lang, setLang] = useState<DemoLang>("TH");
  const [patient, setPatient] = useState<PatientIntake | null>(null);
  const [selectedZones, setSelectedZones] = useState<BodyZoneId[]>([]);

  useEffect(() => {
    const currentLang = loadDemoLang();
    setLang(currentLang);

    const rawZones = window.localStorage.getItem(BODY_MAP_STORAGE_KEY);
    if (rawZones) {
      try {
        const parsed = JSON.parse(rawZones) as BodyZoneId[];
        if (Array.isArray(parsed)) setSelectedZones(parsed);
      } catch {
        // ignore bad saved data
      }
    }

    const rawPatient = window.localStorage.getItem(PATIENT_STORAGE_KEY);
    if (rawPatient) {
      try {
        const parsed = JSON.parse(rawPatient) as PatientIntake;
        setPatient(parsed);
      } catch {
        // ignore bad saved data
      }
    }
  }, []);

  const setLanguage = (value: DemoLang) => {
    setLang(value);
    saveDemoLang(value);
  };

  const t = copy[lang];

  const genderLabel = patient
    ? patient.gender === "male"
      ? t.male
      : patient.gender === "female"
        ? t.female
        : t.other
    : "-";

  const patientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : "";

  const selectedLabels = useMemo(
    () => selectedZones.map((zone) => zoneLabels[zone]?.[lang]).filter(Boolean),
    [lang, selectedZones],
  );

  const introText = patientName ? t.intro : t.introFallback;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f5fbfb_0%,_#edf6ff_100%)] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a href="/body-map" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
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
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">{t.eyebrow}</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">{t.title}</h1>
            <div className="mt-4 max-w-4xl rounded-[28px] border border-rose-200 bg-[linear-gradient(135deg,_#fff1f2_0%,_#ffffff_55%,_#eff6ff_100%)] p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-900 sm:text-base">
                    {t.headlineTop}
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-amber-500 sm:text-5xl">
                    {t.headlineMain}
                  </p>
                </div>
                <div className="rounded-[24px] border border-rose-100 bg-white/80 px-4 py-3 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {lang === "TH" ? "ผลประเมินเบื้องต้น" : "Preliminary screening"}
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-900">
                    {lang === "TH" ? "ควรเริ่มดูแลอาการอย่างต่อเนื่อง" : "Begin active symptom care"}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-base font-semibold leading-8 text-slate-700 sm:text-lg">{introText}</p>
            </div>
            <p className="mt-4 max-w-4xl text-base font-black leading-8 text-teal-700 sm:text-lg">{t.therapyTitle}</p>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-10 sm:py-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.summary}</p>
                    <p className="text-sm font-bold text-slate-900">{t.patientLabel}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm font-medium text-slate-600">
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>{t.patientLabel}</span>
                    <span className="font-bold text-slate-900">{patientName || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>{t.ageLabel}</span>
                    <span className="font-bold text-slate-900">{patient?.age || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                    <span>{t.genderLabel}</span>
                    <span className="font-bold text-slate-900">{genderLabel}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                    <Activity size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.selectedAreas}</p>
                    <p className="text-sm font-bold text-slate-900">{selectedLabels.length} area(s)</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedLabels.length ? (
                    selectedLabels.map((label) => (
                      <span key={label} className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700">
                        {label}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-medium text-slate-500">{t.noAreas}</p>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white p-3 text-amber-700 shadow-sm">
                    <HeartPulse size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-700">{t.riskTitle}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{t.riskValue}</p>
                    <p className="mt-2 text-sm font-medium leading-7 text-amber-950">{t.riskBody}</p>
                  </div>
                </div>
              </div>
            </aside>

            <section className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                {t.exercises.map((item, index) => (
                  <div
                    key={item.title}
                    className="group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_rgba(15,23,42,0.12)]"
                  >
                    <div className="relative overflow-hidden bg-[linear-gradient(135deg,_#ccfbf1_0%,_#ecfeff_45%,_#eff6ff_100%)] p-5">
                      <div className="absolute inset-0 opacity-60">
                        <div className="absolute -left-6 top-4 h-24 w-24 rounded-full bg-teal-300/40 blur-2xl transition duration-500 group-hover:scale-125" />
                        <div className="absolute right-0 top-8 h-20 w-20 rounded-full bg-cyan-300/40 blur-2xl transition duration-500 group-hover:scale-125" />
                        <div className="absolute bottom-0 left-1/2 h-16 w-24 -translate-x-1/2 rounded-full bg-sky-200/50 blur-2xl transition duration-500 group-hover:translate-y-1" />
                      </div>
                      <div className="relative">
                        <div className="flex items-center justify-between">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                            {index + 1}
                          </span>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-teal-700">
                            {t.videoReady}
                          </span>
                        </div>
                        <div className="mt-5 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[24px] border border-teal-100 bg-slate-950/5 backdrop-blur">
                          {index === 0 ? (
                            <video
                              autoPlay
                              className="h-full w-full object-contain"
                              controls
                              loop
                              muted
                              playsInline
                            >
                              <source src={CARD_ONE_VIDEO_SRC} type="video/mp4" />
                            </video>
                          ) : index === 1 ? (
                            <video
                              autoPlay
                              className="h-full w-full object-contain"
                              controls
                              loop
                              muted
                              playsInline
                            >
                              <source src={CARD_TWO_VIDEO_SRC} type="video/mp4" />
                            </video>
                          ) : index === 2 ? (
                            <video
                              autoPlay
                              className="h-full w-full object-contain"
                              controls
                              loop
                              muted
                              playsInline
                            >
                              <source src={CARD_THREE_VIDEO_SRC} type="video/mp4" />
                            </video>
                          ) : (
                            <div className="text-center">
                              <div className="mx-auto h-14 w-14 rounded-full bg-teal-500/15 ring-8 ring-teal-500/10 transition duration-500 group-hover:scale-110 group-hover:ring-teal-500/20" />
                              <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Motion Card</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-lg font-black text-slate-900">{item.title}</p>
                      <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.nextTitle}</p>
                    <p className="text-sm font-bold text-slate-900">{t.therapyTitle}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3 text-sm font-medium leading-7 text-slate-600">
                  {t.nextItems.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-1 shrink-0 text-teal-600" size={16} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild className="h-12 rounded-2xl bg-teal-600 px-6 hover:bg-teal-700">
                  <a href="/body-map">{t.restart}</a>
                </Button>
                <Button asChild className="h-12 rounded-2xl px-6" variant="outline">
                  <a href="/">{t.home}</a>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
