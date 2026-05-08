"use client";

import { AlertCircle, ArrowLeft, Camera, Check, Info, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DemoLang, loadDemoLang, saveDemoLang } from "@/lib/demo-language";

const STORAGE_KEY = "office-relief-body-map";

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

type BodyZone = {
  id: BodyZoneId;
  labels: Record<DemoLang, string>;
  view: "front" | "back";
  shape:
    | { type: "ellipse"; cx: number; cy: number; rx: number; ry: number }
    | { type: "rect"; x: number; y: number; width: number; height: number; rx?: number };
};

const zones: BodyZone[] = [
  { id: "front-shoulder-left", labels: { TH: "ไหล่ซ้ายด้านหน้า", EN: "Front left shoulder" }, view: "front", shape: { type: "ellipse", cx: 55, cy: 92, rx: 22, ry: 16 } },
  { id: "front-shoulder-right", labels: { TH: "ไหล่ขวาด้านหน้า", EN: "Front right shoulder" }, view: "front", shape: { type: "ellipse", cx: 125, cy: 92, rx: 22, ry: 16 } },
  { id: "front-chest", labels: { TH: "หน้าอก", EN: "Chest" }, view: "front", shape: { type: "rect", x: 54, y: 100, width: 72, height: 42, rx: 20 } },
  { id: "front-arm-left", labels: { TH: "แขนซ้ายด้านหน้า", EN: "Front left arm" }, view: "front", shape: { type: "rect", x: 22, y: 106, width: 20, height: 82, rx: 12 } },
  { id: "front-arm-right", labels: { TH: "แขนขวาด้านหน้า", EN: "Front right arm" }, view: "front", shape: { type: "rect", x: 138, y: 106, width: 20, height: 82, rx: 12 } },
  { id: "front-wrist-left", labels: { TH: "ข้อมือซ้าย", EN: "Left wrist" }, view: "front", shape: { type: "rect", x: 24, y: 190, width: 16, height: 26, rx: 8 } },
  { id: "front-wrist-right", labels: { TH: "ข้อมือขวา", EN: "Right wrist" }, view: "front", shape: { type: "rect", x: 140, y: 190, width: 16, height: 26, rx: 8 } },
  { id: "front-thigh-left", labels: { TH: "ต้นขาซ้ายด้านหน้า", EN: "Front left thigh" }, view: "front", shape: { type: "rect", x: 58, y: 214, width: 24, height: 78, rx: 14 } },
  { id: "front-thigh-right", labels: { TH: "ต้นขาขวาด้านหน้า", EN: "Front right thigh" }, view: "front", shape: { type: "rect", x: 98, y: 214, width: 24, height: 78, rx: 14 } },
  { id: "front-knee-left", labels: { TH: "เข่าซ้าย", EN: "Left knee" }, view: "front", shape: { type: "ellipse", cx: 70, cy: 304, rx: 14, ry: 16 } },
  { id: "front-knee-right", labels: { TH: "เข่าขวา", EN: "Right knee" }, view: "front", shape: { type: "ellipse", cx: 110, cy: 304, rx: 14, ry: 16 } },
  { id: "back-neck", labels: { TH: "คอด้านหลัง", EN: "Back of neck" }, view: "back", shape: { type: "ellipse", cx: 90, cy: 66, rx: 14, ry: 12 } },
  { id: "back-shoulder-left", labels: { TH: "ไหล่ซ้ายด้านหลัง", EN: "Back left shoulder" }, view: "back", shape: { type: "ellipse", cx: 55, cy: 92, rx: 22, ry: 16 } },
  { id: "back-shoulder-right", labels: { TH: "ไหล่ขวาด้านหลัง", EN: "Back right shoulder" }, view: "back", shape: { type: "ellipse", cx: 125, cy: 92, rx: 22, ry: 16 } },
  { id: "back-upper-back", labels: { TH: "หลังส่วนบน", EN: "Upper back" }, view: "back", shape: { type: "rect", x: 54, y: 100, width: 72, height: 52, rx: 18 } },
  { id: "back-lower-back", labels: { TH: "หลังส่วนล่าง", EN: "Lower back" }, view: "back", shape: { type: "rect", x: 58, y: 156, width: 64, height: 48, rx: 18 } },
  { id: "back-arm-left", labels: { TH: "แขนซ้ายด้านหลัง", EN: "Back left arm" }, view: "back", shape: { type: "rect", x: 22, y: 106, width: 20, height: 82, rx: 12 } },
  { id: "back-arm-right", labels: { TH: "แขนขวาด้านหลัง", EN: "Back right arm" }, view: "back", shape: { type: "rect", x: 138, y: 106, width: 20, height: 82, rx: 12 } },
  { id: "back-glute-left", labels: { TH: "สะโพกซ้าย", EN: "Left glute" }, view: "back", shape: { type: "ellipse", cx: 68, cy: 230, rx: 24, ry: 22 } },
  { id: "back-glute-right", labels: { TH: "สะโพกขวา", EN: "Right glute" }, view: "back", shape: { type: "ellipse", cx: 112, cy: 230, rx: 24, ry: 22 } },
  { id: "back-thigh-left", labels: { TH: "ต้นขาซ้ายด้านหลัง", EN: "Back left thigh" }, view: "back", shape: { type: "rect", x: 58, y: 250, width: 24, height: 78, rx: 14 } },
  { id: "back-thigh-right", labels: { TH: "ต้นขาขวาด้านหลัง", EN: "Back right thigh" }, view: "back", shape: { type: "rect", x: 98, y: 250, width: 24, height: 78, rx: 14 } },
  { id: "back-calf-left", labels: { TH: "น่องซ้าย", EN: "Left calf" }, view: "back", shape: { type: "rect", x: 60, y: 334, width: 20, height: 58, rx: 12 } },
  { id: "back-calf-right", labels: { TH: "น่องขวา", EN: "Right calf" }, view: "back", shape: { type: "rect", x: 100, y: 334, width: 20, height: 58, rx: 12 } },
];

const copy = {
  TH: {
    back: "กลับไปหน้า Assessment",
    eyebrow: "Body Map Mockup",
    title: "เลือกตำแหน่งที่มีอาการปวดบนสรีระร่างกาย",
    body: "หน้านี้ใช้ SVG ที่คลิกได้เพื่อให้ hover เปลี่ยนสี เลือกทีละส่วน และบันทึกค่าที่เลือกได้ง่าย เพื่อใช้เป็นข้อมูลตั้งต้นใน flow ของเดโม",
    noteTitle: "หมายเหตุสำคัญ",
    noteBody:
      "ถ้ายังไม่มั่นใจว่าปวดตรงจุดไหนพอดี สามารถเลือกหลายบริเวณที่เกี่ยวข้องพร้อมกันได้ เช่น ถ้ารู้สึกปวดแถวหัวไหล่ ให้เลือกทั้งไหล่ซ้าย/ขวา หลังส่วนบน หรือแขนด้านบนร่วมกันได้ตามอาการ",
    front: "ด้านหน้า",
    backView: "ด้านหลัง",
    save: "บันทึกตำแหน่งที่ปวด",
    saveNext: "ส่งไปยังเอเจนท์น้องจิมใจดี",
    clear: "ล้างทั้งหมด",
    saved: "บันทึกตำแหน่งที่ปวดเรียบร้อยแล้ว",
    agentSaved: "บันทึกข้อมูลเพื่อส่งต่อให้น้องจิมใจดีแล้ว",
    cleared: "ล้างการเลือกทั้งหมดแล้ว",
    how: "How it works",
    howTitle: "Hover แล้วสีเปลี่ยน คลิกแล้วค้าง",
    how1: "เอาเมาส์ไปวางบนแต่ละส่วนเพื่อ preview ตำแหน่ง",
    how2: "คลิกเพื่อเลือกหรือยกเลิกการเลือกตำแหน่งที่ปวด",
    how3: "กดบันทึกหรือส่งไปยังเอเจนท์ เพื่อเก็บผลไว้ใน flow",
    selected: "ตำแหน่งที่เลือก",
    none: "ยังไม่ได้เลือกตำแหน่งที่ปวด",
  },
  EN: {
    back: "Back to Assessment",
    eyebrow: "Body Map Mockup",
    title: "Select the body areas where pain is present",
    body: "This page uses a clickable SVG body map so each area can highlight on hover, be selected individually, and then be saved as part of the demo flow.",
    noteTitle: "Important note",
    noteBody:
      "If you are not fully sure about the exact pain point, you can select multiple related areas at the same time. For example, shoulder pain can be marked across both shoulders, the upper back, or upper arm areas.",
    front: "Front",
    backView: "Back",
    save: "Save pain areas",
    saveNext: "Send to Nong Jim Jaidee Agent",
    clear: "Clear all",
    saved: "Pain areas saved successfully",
    agentSaved: "Pain areas were saved and prepared for the Nong Jim Jaidee Agent flow",
    cleared: "All selections were cleared",
    how: "How it works",
    howTitle: "Hover to preview, click to lock selection",
    how1: "Move the cursor over each area to preview the region",
    how2: "Click to select or unselect the pain location",
    how3: "Use Save or send to the agent to keep this step in the flow",
    selected: "Selected areas",
    none: "No pain areas selected yet",
  },
} as const;

export default function BodyMapPage() {
  const router = useRouter();
  const [lang, setLang] = useState<DemoLang>("TH");
  const [selected, setSelected] = useState<BodyZoneId[]>([]);
  const [hovered, setHovered] = useState<BodyZoneId | null>(null);
  const [savedNotice, setSavedNotice] = useState("");

  useEffect(() => {
    const currentLang = loadDemoLang();
    setLang(currentLang);
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as BodyZoneId[];
      if (Array.isArray(parsed)) setSelected(parsed);
    } catch {
      // ignore bad saved data
    }
  }, []);

  const setLanguage = (value: DemoLang) => {
    setLang(value);
    saveDemoLang(value);
    if (savedNotice === copy.TH.saved || savedNotice === copy.EN.saved) setSavedNotice(copy[value].saved);
    if (savedNotice === copy.TH.agentSaved || savedNotice === copy.EN.agentSaved) setSavedNotice(copy[value].agentSaved);
    if (savedNotice === copy.TH.cleared || savedNotice === copy.EN.cleared) setSavedNotice(copy[value].cleared);
  };

  const t = copy[lang];

  const selectedLabels = useMemo(
    () => zones.filter((zone) => selected.includes(zone.id)).map((zone) => zone.labels[lang]),
    [selected, lang],
  );

  const toggleZone = (id: BodyZoneId) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const saveSelection = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    setSavedNotice(t.saved);
    window.setTimeout(() => setSavedNotice(""), 2000);
  };

  const saveAndContinue = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    router.push("/result");
  };

  const clearSelection = () => {
    setSelected([]);
    window.localStorage.removeItem(STORAGE_KEY);
    setSavedNotice(t.cleared);
    window.setTimeout(() => setSavedNotice(""), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f4f8fb] px-4 py-6 text-slate-900 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <a href="/assessment" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
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
            <div className="mt-4 max-w-3xl rounded-[20px] border border-amber-200 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 px-4 py-4 shadow-sm sm:rounded-[24px] sm:px-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-2.5 text-amber-600 shadow-sm">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-amber-700">{t.noteTitle}</p>
                  <p className="mt-2 text-sm font-semibold leading-7 text-amber-950">{t.noteBody}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 sm:px-10 sm:py-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
            <section>
              <div className="grid gap-6 lg:grid-cols-2">
                <BodyFigure
                  hovered={hovered}
                  lang={lang}
                  selected={selected}
                  setHovered={setHovered}
                  title={t.front}
                  toggleZone={toggleZone}
                  view="front"
                />
                <BodyFigure
                  hovered={hovered}
                  lang={lang}
                  selected={selected}
                  setHovered={setHovered}
                  title={t.backView}
                  toggleZone={toggleZone}
                  view="back"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button className="h-12 rounded-2xl bg-teal-600 px-6 hover:bg-teal-700" onClick={saveSelection} type="button">
                  <Check size={16} />
                  {t.save}
                </Button>
                <Button
                  className="h-12 rounded-2xl bg-slate-900 px-6 hover:bg-slate-800"
                  disabled={!selected.length}
                  onClick={saveAndContinue}
                  type="button"
                >
                  <Camera size={16} />
                  {t.saveNext}
                </Button>
                <Button className="h-12 rounded-2xl px-6" onClick={clearSelection} type="button" variant="outline">
                  <RotateCcw size={16} />
                  {t.clear}
                </Button>
              </div>

              {savedNotice ? (
                <p className="mt-4 inline-flex rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700">
                  {savedNotice}
                </p>
              ) : null}
            </section>

            <aside className="space-y-5">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-3 text-teal-700 shadow-sm">
                    <Info size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.how}</p>
                    <p className="text-sm font-bold text-slate-900">{t.howTitle}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-3 text-sm font-medium leading-7 text-slate-600">
                  <li>{t.how1}</li>
                  <li>{t.how2}</li>
                  <li>{t.how3}</li>
                </ul>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{t.selected}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedLabels.length ? (
                    selectedLabels.map((label) => (
                      <span key={label} className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-bold text-teal-700">
                        {label}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-medium text-slate-500">{t.none}</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

function BodyFigure({
  view,
  title,
  selected,
  hovered,
  setHovered,
  toggleZone,
  lang,
}: {
  view: "front" | "back";
  title: string;
  selected: BodyZoneId[];
  hovered: BodyZoneId | null;
  setHovered: (value: BodyZoneId | null) => void;
  toggleZone: (id: BodyZoneId) => void;
  lang: DemoLang;
}) {
  const viewZones = zones.filter((zone) => zone.view === view);

  return (
    <div className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-center text-sm font-black uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <svg className="mt-4 w-full" viewBox="0 0 180 440">
        <BodySilhouette />
        {viewZones.map((zone) => {
          const active = selected.includes(zone.id);
          const hot = hovered === zone.id;
          const fill = active ? "#14b8a6" : hot ? "#7dd3fc" : "rgba(20,184,166,0.22)";
          const stroke = active ? "#0f766e" : hot ? "#0284c7" : "rgba(15,23,42,0.10)";

          const commonProps = {
            fill,
            stroke,
            strokeWidth: 2,
            onClick: () => toggleZone(zone.id),
            onMouseEnter: () => setHovered(zone.id),
            onMouseLeave: () => setHovered(null),
            className: "cursor-pointer transition-all duration-150",
          };

          if (zone.shape.type === "ellipse") {
            return <ellipse key={zone.id} cx={zone.shape.cx} cy={zone.shape.cy} rx={zone.shape.rx} ry={zone.shape.ry} {...commonProps} />;
          }
          return <rect key={zone.id} x={zone.shape.x} y={zone.shape.y} width={zone.shape.width} height={zone.shape.height} rx={zone.shape.rx ?? 0} {...commonProps} />;
        })}
      </svg>
      {hovered ? (
        <p className="mt-3 text-center text-sm font-bold text-slate-600">
          {zones.find((zone) => zone.id === hovered && zone.view === view)?.labels[lang] ?? ""}
        </p>
      ) : null}
    </div>
  );
}

function BodySilhouette() {
  return (
    <g fill="#e9eef5" stroke="#d6dee8" strokeWidth="2">
      <ellipse cx="90" cy="34" rx="22" ry="26" />
      <rect x="80" y="56" width="20" height="22" rx="8" />
      <path d="M50 82 C62 72, 118 72, 130 82 L138 116 C140 126, 136 158, 132 186 L124 226 C120 242, 110 252, 90 254 C70 252, 60 242, 56 226 L48 186 C44 158, 40 126, 42 116 Z" />
      <path d="M42 88 C28 98, 22 118, 20 140 L18 186 C18 198, 24 204, 32 204 C38 204, 42 196, 44 186 L48 142 C50 124, 50 100, 42 88 Z" />
      <path d="M138 88 C152 98, 158 118, 160 140 L162 186 C162 198, 156 204, 148 204 C142 204, 138 196, 136 186 L132 142 C130 124, 130 100, 138 88 Z" />
      <path d="M64 254 L56 326 C54 346, 56 396, 64 416 C68 424, 80 424, 82 414 L84 324 C84 302, 82 274, 78 256 Z" />
      <path d="M116 254 L124 326 C126 346, 124 396, 116 416 C112 424, 100 424, 98 414 L96 324 C96 302, 98 274, 102 256 Z" />
    </g>
  );
}
