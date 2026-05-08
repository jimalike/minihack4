"use client";

import {
  Activity,
  ArrowRight,
  Camera,
  ChevronDown,
  HeartPulse,
  Languages as LanguagesIcon,
  LineChart,
  ScanFace,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Lang = "TH" | "EN";

const STORAGE_KEY = "office-therapy-landing-language";

const copy = {
  TH: {
    brand: "Office Relief AI",
    eyebrow: "AI ภาพบำบัดและประเมินออฟฟิศซินโดรม",
    headline1: "ประเมินอาการ",
    headline2: "พร้อมฝึกท่าบำบัด",
    headline3: "ให้ถูกต้องที่บ้าน",
    sub:
      "แอปช่วยประเมินอาการเบื้องต้นจากแบบสอบถามและการทำท่าทางบางส่วน เพื่อดูแนวโน้มของออฟฟิศซินโดรม ช่วยแนะนำการฝึกที่เหมาะสม และบอกได้ว่าควรเฝ้าดูอาการต่อหรือปรึกษาแพทย์",
    ctaPrimary: "เริ่มต้นใช้งาน",
    footer: "Prototype landing page for therapy and office syndrome screening",
    stats: [
      { label: "คัดกรองเบื้องต้น", value: "อายุ / เพศ / ลักษณะงาน", tone: "teal" },
      { label: "ประเมินบางท่าทาง", value: "กล้องช่วยดูการเคลื่อนไหว", tone: "cyan" },
      { label: "ติดตามอาการ", value: "เก็บประวัติการฝึกและความรู้สึก", tone: "slate" },
    ],
    panelTitle: "ภาพรวมการประเมิน",
    panelSub: "ตัวอย่างผลประเมินเบื้องต้นจากข้อมูลที่ผู้ใช้ทำได้",
    readiness: "ตัวอย่างเดโม",
    severityLabel: "แนวโน้มอาการ",
    severityValue: "ควรเฝ้าระวัง",
    accuracyLabel: "การทำท่าที่ระบบพอประเมินได้",
    accuracyValue: "บางส่วน",
    postureTitle: "ตัวอย่างท่าที่ใช้ประเมิน",
    postureValue: "Neck & Shoulder Mobility",
    bodyMapTitle: "จุดที่ผู้ใช้ระบุว่ามีอาการ",
    bodyMapItems: ["คอ", "บ่า", "ไหล่ขวา"],
    timelineTitle: "สิ่งที่แอปช่วยต่อได้",
    timelineItems: ["ประเมินอาการรายวัน", "แนะนำท่าฝึกพื้นฐาน", "ติดตามความเปลี่ยนแปลงรายสัปดาห์"],
  },
  EN: {
    brand: "Office Relief AI",
    eyebrow: "AI therapy guidance for office syndrome screening",
    headline1: "Assess pain,",
    headline2: "train the right posture,",
    headline3: "and track recovery at home",
    sub:
      "The app offers an initial office-syndrome assessment from questionnaires and a limited set of guided movements. It is meant to suggest patterns, support basic exercise guidance, and help users decide whether to keep monitoring or consult a doctor.",
    ctaPrimary: "Open demo",
    footer: "Prototype landing page for therapy and office syndrome screening",
    stats: [
      { label: "Initial screening", value: "age / sex / work style", tone: "teal" },
      { label: "Limited pose review", value: "camera-assisted movement review", tone: "cyan" },
      { label: "Symptom tracking", value: "exercise history and self-reports", tone: "slate" },
    ],
    panelTitle: "Assessment overview",
    panelSub: "Example of a lightweight, first-pass assessment",
    readiness: "Demo preview",
    severityLabel: "Symptom trend",
    severityValue: "Needs monitoring",
    accuracyLabel: "Pose review coverage",
    accuracyValue: "Partial",
    postureTitle: "Example guided pose",
    postureValue: "Neck & Shoulder Mobility",
    bodyMapTitle: "Reported discomfort areas",
    bodyMapItems: ["Neck", "Upper trap", "Right shoulder"],
    timelineTitle: "What the app can support",
    timelineItems: ["Daily symptom check", "Basic guided exercises", "Weekly change review"],
  },
} as const;

type CopyKey = keyof typeof copy.TH;

function t(lang: Lang, key: CopyKey) {
  return copy[lang][key] ?? copy.TH[key];
}

const supportedLangs: Array<{ code: Lang; name: string; flag: string }> = [
  { code: "TH", name: "ไทย", flag: "TH" },
  { code: "EN", name: "English", flag: "EN" },
];

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("TH");
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "TH" || stored === "EN") setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!langOpen) return;
    const onClick = (event: MouseEvent) => {
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [langOpen]);

  return (
    <div className="min-h-screen bg-[#f5f8fb] text-slate-900">
      <Navbar
        lang={lang}
        langOpen={langOpen}
        langRef={langRef}
        scrolled={scrolled}
        setLang={setLang}
        setLangOpen={setLangOpen}
      />

      <main>
        <Hero lang={lang} />
      </main>

      <Footer lang={lang} />
    </div>
  );
}

function Navbar({
  scrolled,
  lang,
  langOpen,
  setLangOpen,
  setLang,
  langRef,
}: {
  scrolled: boolean;
  lang: Lang;
  langOpen: boolean;
  setLangOpen: (value: boolean) => void;
  setLang: (value: Lang) => void;
  langRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <nav
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-slate-200 bg-white/92 shadow-sm backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-sm">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-teal-600">AI Rehab</p>
            <p className="text-sm font-bold text-slate-800">{t(lang, "brand")}</p>
          </div>
        </a>

        <div className="flex items-center gap-3">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white/85 px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-white"
            >
              <LanguagesIcon size={13} />
              <span>{lang}</span>
              <ChevronDown size={12} />
            </button>
            {langOpen ? (
              <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                {supportedLangs.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setLang(item.code);
                      setLangOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-semibold transition",
                      item.code === lang
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black">
                      {item.flag}
                    </span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <Button asChild size="sm" className="hidden rounded-full bg-teal-600 hover:bg-teal-700 sm:inline-flex">
            <a href="/scan">
              {t(lang, "ctaPrimary")}
              <ArrowRight size={14} />
            </a>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function Hero({ lang }: { lang: Lang }) {
  const stats = t(lang, "stats") as Array<{ label: string; value: string; tone: "teal" | "cyan" | "slate" }>;
  const bodyMapItems = t(lang, "bodyMapItems") as string[];
  const timelineItems = t(lang, "timelineItems") as string[];

  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(circle at 15% 20%, rgba(20,184,166,0.16), transparent 28%), radial-gradient(circle at 85% 22%, rgba(59,130,246,0.14), transparent 24%), linear-gradient(180deg, #f8fbff 0%, #eef6fb 100%)",
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: "radial-gradient(rgba(15,23,42,0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-4 py-1.5 shadow-sm">
            <Sparkles size={14} className="text-teal-600" />
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-700">
              {t(lang, "eyebrow")}
            </span>
          </div>

          <h1 className="mt-6 max-w-3xl text-[clamp(2.5rem,6vw,4.7rem)] font-black leading-[1.02] tracking-tight text-slate-900">
            {t(lang, "headline1")}
            <span className="block text-teal-600">{t(lang, "headline2")}</span>
            <span className="block text-slate-700">{t(lang, "headline3")}</span>
          </h1>

          <p className="mt-5 max-w-2xl text-base font-medium leading-8 text-slate-600 sm:text-lg">
            {t(lang, "sub")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-2xl bg-teal-600 px-6 hover:bg-teal-700">
              <a href="/scan">
                {t(lang, "ctaPrimary")}
                <ArrowRight size={16} />
              </a>
            </Button>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {stats.map((item) => (
              <div
                key={item.label}
                className={cn(
                  "rounded-3xl border p-4 shadow-sm backdrop-blur-sm",
                  item.tone === "teal" && "border-teal-100 bg-white/90",
                  item.tone === "cyan" && "border-cyan-100 bg-cyan-50/70",
                  item.tone === "slate" && "border-slate-200 bg-slate-50/85",
                )}
              >
                <div
                  className={cn(
                    "mb-3 flex h-10 w-10 items-center justify-center rounded-2xl",
                    item.tone === "teal" && "bg-teal-100 text-teal-700",
                    item.tone === "cyan" && "bg-cyan-100 text-cyan-700",
                    item.tone === "slate" && "bg-slate-200 text-slate-700",
                  )}
                >
                  {item.tone === "teal" ? <HeartPulse size={18} /> : item.tone === "cyan" ? <ScanFace size={18} /> : <LineChart size={18} />}
                </div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-teal-200/50 blur-3xl" />
          <div className="absolute -right-4 bottom-4 h-40 w-40 rounded-full bg-cyan-200/40 blur-3xl" />

          <div className="relative overflow-hidden rounded-[36px] border border-white/80 bg-white/92 p-5 shadow-[0_28px_90px_rgba(15,23,42,0.14)] backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">
                  {t(lang, "panelTitle")}
                </p>
                <h2 className="mt-2 text-2xl font-black leading-tight text-slate-900">
                  {t(lang, "panelSub")}
                </h2>
              </div>
              <Badge className="border-0 bg-emerald-100 text-emerald-700">
                {t(lang, "readiness")}
              </Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] bg-slate-950 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-white/10 p-2 text-teal-300">
                    <ShieldCheck size={18} />
                  </div>
                  <span className="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-300">
                    {t(lang, "severityValue")}
                  </span>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-white/55">
                  {t(lang, "severityLabel")}
                </p>
                <p className="mt-2 text-3xl font-black">{t(lang, "severityValue")}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
                </div>
              </div>

              <div className="rounded-[28px] border border-cyan-100 bg-cyan-50/80 p-5">
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl bg-white p-2 text-cyan-700 shadow-sm">
                    <Camera size={18} />
                  </div>
                  <span className="text-lg font-black text-cyan-800">{t(lang, "accuracyValue")}</span>
                </div>
                <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-cyan-700/80">
                  {t(lang, "accuracyLabel")}
                </p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {t(lang, "postureTitle")}
                </p>
                <p className="mt-1 text-base font-black text-slate-900">{t(lang, "postureValue")}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[0.92fr_1.08fr]">
              <div className="rounded-[30px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  {t(lang, "bodyMapTitle")}
                </p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="relative h-56 w-32">
                    <div className="absolute left-1/2 top-0 h-11 w-11 -translate-x-1/2 rounded-full border-4 border-slate-200 bg-slate-100" />
                    <div className="absolute left-1/2 top-10 h-24 w-16 -translate-x-1/2 rounded-[28px] border-4 border-slate-200 bg-slate-100" />
                    <div className="absolute left-[15px] top-[54px] h-16 w-4 rotate-[22deg] rounded-full border-4 border-slate-200 bg-slate-100" />
                    <div className="absolute right-[15px] top-[54px] h-16 w-4 -rotate-[22deg] rounded-full border-4 border-slate-200 bg-slate-100" />
                    <div className="absolute left-[34px] top-[128px] h-20 w-4 rotate-[8deg] rounded-full border-4 border-slate-200 bg-slate-100" />
                    <div className="absolute right-[34px] top-[128px] h-20 w-4 -rotate-[8deg] rounded-full border-4 border-slate-200 bg-slate-100" />
                    <div className="absolute left-1/2 top-[38px] h-4 w-8 -translate-x-1/2 rounded-full bg-amber-300/80 blur-[1px]" />
                    <div className="absolute left-[18px] top-[62px] h-4 w-4 rounded-full bg-amber-300/80 blur-[1px]" />
                    <div className="absolute right-[18px] top-[62px] h-4 w-4 rounded-full bg-rose-300/80 blur-[1px]" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {bodyMapItems.map((item) => (
                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-slate-200 bg-white p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  {t(lang, "timelineTitle")}
                </p>
                <div className="mt-5 space-y-4">
                  {timelineItems.map((item, index) => (
                    <div key={item} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-black text-white">
                          {index + 1}
                        </div>
                        {index < timelineItems.length - 1 ? <div className="mt-2 h-8 w-px bg-slate-200" /> : null}
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold leading-6 text-slate-700">{item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-7 sm:flex-row sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-500 text-white">
            <Activity size={16} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">{t(lang, "brand")}</p>
            <p className="text-xs font-semibold text-slate-500">SuperAI Hackathon</p>
          </div>
        </div>
        <p className="text-center text-xs font-semibold text-slate-500">{t(lang, "footer")}</p>
      </div>
    </footer>
  );
}
