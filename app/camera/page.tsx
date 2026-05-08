"use client";

import { ArrowLeft, Camera, CheckCircle2, ScanFace, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DemoLang, loadDemoLang, saveDemoLang } from "@/lib/demo-language";

const BODY_MAP_STORAGE_KEY = "office-relief-body-map";

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
    eyebrow: "Camera Mockup",
    title: "เตรียมเปิดกล้องเพื่อประเมินท่าทาง",
    body:
      "หน้านี้เป็น mockup สำหรับขั้นถัดไปของเดโม หลังจากผู้ใช้เลือกตำแหน่งที่ปวดแล้ว ระบบจะพาเข้าหน้านี้เพื่อเตรียมเปิดกล้องและแสดงคำแนะนำก่อนเริ่มทำท่าตามที่แอปกำหนด",
    preview: "Live Camera Preview",
    mockup: "Mockup",
    previewTitle: "พื้นที่แสดงภาพจากกล้อง",
    previewBody: "สำหรับเดโมตอนนี้ยังเป็นหน้าจำลอง เพื่อเตรียมต่อเข้ากับการตรวจจับท่าทางจริงในขั้นถัดไป",
    openCamera: "ติดต่อน้องจิมใจดี",
    carryTitle: "ข้อมูลที่พามาต่อ",
    carryBody: "ตำแหน่งที่ผู้ใช้เลือกไว้จาก Body Map",
    noData: "ยังไม่มีตำแหน่งที่บันทึกไว้",
    nextTitle: "Next Step",
    nextBody: "สิ่งที่หน้ากล้องจะทำต่อในอนาคต",
    next1: "แนะนำท่าที่สัมพันธ์กับบริเวณที่ผู้ใช้ระบุว่าปวด",
    next2: "เปิดกล้องเพื่อตรวจท่าทางเบื้องต้นว่าผู้ใช้ทำท่าได้ใกล้เคียงแค่ไหน",
    next3: "บันทึกผลของแต่ละรอบการทำท่าไว้สำหรับสรุปผลภายหลัง",
    note: "หน้านี้ยังเป็น mockup สำหรับ flow demo เท่านั้น ตอนนี้ปุ่มเปิดกล้องและเริ่มทดสอบท่ายังไม่ได้เชื่อมกับ camera API จริง",
  },
  EN: {
    back: "Back to Body Map",
    eyebrow: "Camera Mockup",
    title: "Prepare to open the camera for pose assessment",
    body:
      "This page is the next mockup step in the demo. After the user selects pain areas, the flow moves here to prepare camera access and show guidance before pose testing begins.",
    preview: "Live Camera Preview",
    mockup: "Mockup",
    previewTitle: "Camera preview area",
    previewBody: "At the moment this is still a placeholder screen for the future real camera-based pose detection step.",
    openCamera: "Contact Nong Jim Jaidee",
    carryTitle: "Carried data",
    carryBody: "Pain areas selected from the Body Map",
    noData: "No saved pain areas yet",
    nextTitle: "Next Step",
    nextBody: "What this camera page is intended to do later",
    next1: "Recommend poses related to the pain areas selected by the user",
    next2: "Open the camera to estimate whether the pose is performed closely enough",
    next3: "Store each round so the app can summarize progress later",
    note: "This page is still only a mockup for the demo flow. The camera and pose buttons are not connected to a real camera API yet.",
  },
} as const;

export default function CameraPage() {
  const router = useRouter();
  const [lang, setLang] = useState<DemoLang>("TH");
  const [selectedZones, setSelectedZones] = useState<BodyZoneId[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [cameraStatus, setCameraStatus] = useState<"idle" | "preparing">("idle");

  useEffect(() => {
    router.replace("/body-map");
  }, [router]);

  useEffect(() => {
    const currentLang = loadDemoLang();
    setLang(currentLang);
    const raw = window.localStorage.getItem(BODY_MAP_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as BodyZoneId[];
      if (Array.isArray(parsed)) setSelectedZones(parsed);
    } catch {
      // ignore bad saved data
    }
  }, []);

  useEffect(() => {
    if (!showDisclaimer) return;

    setCountdown(5);
    const intervalId = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId);
          setShowDisclaimer(false);
          setCameraStatus("preparing");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [showDisclaimer]);

  const setLanguage = (value: DemoLang) => {
    setLang(value);
    saveDemoLang(value);
  };

  const t = copy[lang];

  const selectedLabels = useMemo(
    () => selectedZones.map((zone) => zoneLabels[zone]?.[lang]).filter(Boolean),
    [selectedZones, lang],
  );

  return null;

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
            <p className="mt-3 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-base">{t.body}</p>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-10 sm:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8">
            <section className="space-y-5">
              <div className="overflow-hidden rounded-[26px] bg-slate-950 p-3 shadow-[0_24px_80px_rgba(15,23,42,0.30)] sm:rounded-[32px] sm:p-4">
                <div className="rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.18),_transparent_35%),linear-gradient(180deg,_#0f172a_0%,_#111827_100%)] p-4 sm:rounded-[28px] sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-white/80">
                    <span className="text-xs font-black uppercase tracking-[0.16em]">{t.preview}</span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{t.mockup}</span>
                  </div>

                  <div className="relative mt-4 flex aspect-[3/4] items-center justify-center rounded-[20px] border border-dashed border-teal-300/40 bg-white/5 sm:aspect-[4/5] sm:rounded-[24px]">
                    <div className="pointer-events-none absolute inset-4 rounded-[16px] border border-teal-300/30 sm:inset-6 sm:rounded-[20px]" />
                    <div className="pointer-events-none absolute left-1/2 top-10 h-20 w-20 -translate-x-1/2 rounded-full border-2 border-teal-300/60" />
                    <div className="pointer-events-none absolute left-1/2 top-[7.5rem] h-40 w-32 -translate-x-1/2 rounded-[40px] border-2 border-teal-300/60" />
                    <div className="pointer-events-none absolute left-[22%] top-[36%] h-24 w-10 rounded-full border-2 border-teal-300/50" />
                    <div className="pointer-events-none absolute right-[22%] top-[36%] h-24 w-10 rounded-full border-2 border-teal-300/50" />
                    <div className="pointer-events-none absolute bottom-[18%] left-[39%] h-24 w-10 rounded-full border-2 border-teal-300/50" />
                    <div className="pointer-events-none absolute bottom-[18%] right-[39%] h-24 w-10 rounded-full border-2 border-teal-300/50" />

                    <div className="text-center text-white">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-500/20 text-teal-200">
                        <ScanFace size={30} />
                      </div>
                      <p className="mt-4 text-base font-black sm:text-lg">
                        {cameraStatus === "preparing"
                          ? lang === "TH"
                            ? "กำลังเตรียมเปิดกล้อง"
                            : "Preparing camera access"
                          : t.previewTitle}
                      </p>
                      <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-white/70 sm:leading-7">
                        {cameraStatus === "preparing"
                          ? lang === "TH"
                            ? "เดโมจะหยุดไว้ที่ขั้นตอนยืนยันคำเตือนก่อนใช้งาน ยังไม่ได้เชื่อมต่อ camera API จริง"
                            : "The demo stops at the warning-confirmation step and is not connected to a real camera API yet."
                          : t.previewBody}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <Button
                      className="h-12 rounded-2xl bg-teal-600 hover:bg-teal-700"
                      type="button"
                      onClick={() => {
                        setCameraStatus("idle");
                        setShowDisclaimer(true);
                      }}
                    >
                      <Camera size={16} />
                      {t.openCamera}
                    </Button>
                    {cameraStatus === "preparing" ? (
                      <p className="text-sm font-medium text-teal-100/90">
                        {lang === "TH"
                          ? "รับทราบคำเตือนแล้ว และกำลังเตรียมเข้าสู่ขั้นตอนกล้องของเดโม"
                          : "Warning acknowledged. Preparing the camera step in the demo."}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.carryTitle}</p>
                    <p className="text-sm font-bold text-slate-900">{t.carryBody}</p>
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
                    <p className="text-sm font-medium text-slate-500">{t.noData}</p>
                  )}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.nextTitle}</p>
                    <p className="text-sm font-bold text-slate-900">{t.nextBody}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3 text-sm font-medium leading-7 text-slate-600">
                  <li>{t.next1}</li>
                  <li>{t.next2}</li>
                  <li>{t.next3}</li>
                </ul>
              </div>

              <div className="rounded-[28px] border border-amber-100 bg-amber-50 p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 text-amber-700" size={18} />
                  <p className="text-sm font-medium leading-7 text-amber-900">{t.note}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {showDisclaimer ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.30)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <ShieldCheck size={22} />
              </div>
              <div className="flex-1">
                <p className="text-xl font-black text-slate-900 sm:text-2xl">
                  {lang === "TH" ? "หมายเหตุก่อนใช้งาน" : "Before you continue"}
                </p>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-700 sm:text-base">
                  {lang === "TH"
                    ? "แอปนี้เป็นเพียงการคัดกรองเบื้องต้นไม่ใช่เครื่องมือวินิจฉัยโรค หากปวดรุนแรง ปวดร้าว ชา อ่อนแรง หรือมีอาการต่อเนื่อง ควรปรึกษาผู้เชี่ยวชาญด้านสุขภาพ"
                    : "This app is not a diagnostic tool. If you have severe pain, radiating pain, numbness, weakness, or persistent symptoms, you should consult a qualified health professional."}
                </p>
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
                  {lang === "TH"
                    ? `ระบบจะดำเนินการต่อใน ${countdown} วินาที`
                    : `The demo will continue in ${countdown} seconds`}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
