"use client";

import {
  ArrowRight,
  ChevronDown,
  Languages as LanguagesIcon,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types — local copy so /persona is standalone (doesn't import scanner module).
// ---------------------------------------------------------------------------

type Lang = "EN" | "TH" | "JP" | "CN" | "KR" | "AR";
type Allergen =
  | "peanut"
  | "treeNuts"
  | "shellfish"
  | "fish"
  | "egg"
  | "soy"
  | "milk"
  | "gluten"
  | "sesame";
type Diet = "vegan" | "vegetarian" | "halal" | "glutenFree";

type StoredProfile = {
  allergens: Allergen[];
  diets: Diet[];
  highContrast: boolean;
  language: Lang;
};

const STORAGE_KEY = "thai-safe-bite-profile";

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const personaCopy = {
  EN: {
    pageEyebrow: "Personal profile",
    pageTitle: "Tell us what to watch out for",
    pageSub: "Pick anything you're allergic to or any diet you follow. We use this to flag risky menu items and to write the right Thai phrase for the vendor.",
    allergensHeader: "Allergens",
    allergensSub: "Tap any that apply",
    dietsHeader: "Diet & lifestyle",
    dietsSub: "Optional",
    samplesHeader: "Quick start",
    samplesSub: "Pick a preset to fill the picker:",
    sampleAllergyPeanut: "Peanut allergy",
    sampleHalal: "Halal",
    sampleVegan: "Vegan",
    sampleAll: "All allergens",
    saveAndScan: "Save and open scanner",
    skip: "Skip for now",
    selected: "selected",
    nothingSelected: "No restrictions selected — that's fine, you can still scan.",
    backHome: "Back to home",
    signIn: "Sign in",
    navScanner: "Scanner",
    navPersona: "Persona",
    navPhrase: "Phrase Card",
    disclaimer: "We save this on your device only. No signup, no tracking.",
  },
  TH: {
    pageEyebrow: "โปรไฟล์ส่วนตัว",
    pageTitle: "บอกเราว่าต้องระวังอะไรบ้าง",
    pageSub: "เลือกสิ่งที่แพ้หรือข้อจำกัดอาหารที่ทาน เราใช้ข้อมูลนี้เพื่อเตือนเมนูเสี่ยง และสร้างประโยคไทยให้ยื่นแม่ค้า",
    allergensHeader: "อาหารที่แพ้",
    allergensSub: "แตะอันที่ใช่",
    dietsHeader: "ข้อจำกัด/ไลฟ์สไตล์",
    dietsSub: "ไม่บังคับ",
    samplesHeader: "เริ่มแบบเร็ว",
    samplesSub: "เลือก preset เพื่อกรอกให้อัตโนมัติ:",
    sampleAllergyPeanut: "แพ้ถั่วลิสง",
    sampleHalal: "ฮาลาล",
    sampleVegan: "วีแกน",
    sampleAll: "แพ้ทุกอย่าง",
    saveAndScan: "บันทึกและเปิด scanner",
    skip: "ข้ามไปก่อน",
    selected: "เลือกแล้ว",
    nothingSelected: "ยังไม่ได้เลือกข้อจำกัด — ไม่เป็นไร สแกนได้ปกติ",
    backHome: "กลับหน้าแรก",
    signIn: "เข้าสู่ระบบ",
    navScanner: "สแกนเนอร์",
    navPersona: "โปรไฟล์",
    navPhrase: "การ์ดประโยค",
    disclaimer: "ข้อมูลถูกเก็บไว้บนเครื่องของคุณเท่านั้น ไม่ต้องสมัคร ไม่มีการติดตาม",
  },
  JP: {
    pageEyebrow: "個人プロフィール",
    pageTitle: "気をつけたいものを教えてください",
    pageSub: "アレルギーや食事制限を選んでください。リスクのあるメニュー項目を警告し、店員に渡す適切なタイ語フレーズを作成します。",
    allergensHeader: "アレルギー",
    allergensSub: "該当するものをタップ",
    dietsHeader: "食事制限・ライフスタイル",
    dietsSub: "任意",
    samplesHeader: "クイックスタート",
    samplesSub: "プリセットを選んでフィルターを埋めます:",
    sampleAllergyPeanut: "ピーナッツアレルギー",
    sampleHalal: "ハラール",
    sampleVegan: "ヴィーガン",
    sampleAll: "すべてのアレルゲン",
    saveAndScan: "保存してスキャナーを開く",
    skip: "今はスキップ",
    selected: "選択済み",
    nothingSelected: "制限なし — そのままスキャンできます。",
    backHome: "ホームに戻る",
    signIn: "ログイン",
    navScanner: "スキャナー",
    navPersona: "プロフィール",
    navPhrase: "フレーズカード",
    disclaimer: "デバイスにのみ保存されます。登録もトラッキングもありません。",
  },
  CN: {
    pageEyebrow: "个人档案",
    pageTitle: "告诉我们需要注意什么",
    pageSub: "选择你过敏的食物或饮食限制。我们用此标记风险菜单,并为摊主生成合适的泰语短语。",
    allergensHeader: "过敏原",
    allergensSub: "点击适用项",
    dietsHeader: "饮食与生活方式",
    dietsSub: "可选",
    samplesHeader: "快速开始",
    samplesSub: "选择预设自动填充:",
    sampleAllergyPeanut: "花生过敏",
    sampleHalal: "清真",
    sampleVegan: "纯素",
    sampleAll: "所有过敏原",
    saveAndScan: "保存并打开扫描器",
    skip: "暂时跳过",
    selected: "已选",
    nothingSelected: "未选择限制 — 没关系,可以直接扫描。",
    backHome: "返回首页",
    signIn: "登录",
    navScanner: "扫描器",
    navPersona: "档案",
    navPhrase: "短语卡",
    disclaimer: "数据只保存在你的设备上。无需注册,不追踪。",
  },
  KR: {},
  AR: {},
} as const;

type PersonaKey = keyof (typeof personaCopy)["EN"];

function tp(lang: Lang, key: PersonaKey): string {
  const dict = personaCopy[lang] as Partial<Record<PersonaKey, string>>;
  return dict?.[key] ?? personaCopy.EN[key] ?? String(key);
}

// ---------------------------------------------------------------------------
// Allergen / diet labels — duplicated subset (matches landing).
// ---------------------------------------------------------------------------

const allergenInfo: Record<Allergen, { icon: string; labels: Partial<Record<Lang, string>> }> = {
  peanut:    { icon: "🥜", labels: { EN: "Peanut",    TH: "ถั่วลิสง",        JP: "ピーナッツ",     CN: "花生" } },
  treeNuts:  { icon: "🌰", labels: { EN: "Tree nuts", TH: "ถั่วเปลือกแข็ง",   JP: "木の実",        CN: "坚果" } },
  shellfish: { icon: "🦐", labels: { EN: "Shellfish", TH: "กุ้ง ปู หอย",      JP: "甲殻類",        CN: "贝类" } },
  fish:      { icon: "🐟", labels: { EN: "Fish",      TH: "ปลา",             JP: "魚",            CN: "鱼类" } },
  egg:       { icon: "🥚", labels: { EN: "Egg",       TH: "ไข่",              JP: "卵",            CN: "鸡蛋" } },
  soy:       { icon: "🫘", labels: { EN: "Soy",       TH: "ถั่วเหลือง",       JP: "大豆",          CN: "大豆" } },
  milk:      { icon: "🥛", labels: { EN: "Milk",      TH: "นม",              JP: "乳製品",        CN: "牛奶" } },
  gluten:    { icon: "🌾", labels: { EN: "Gluten",    TH: "กลูเตน/แป้งสาลี",   JP: "グルテン",       CN: "麸质" } },
  sesame:    { icon: "⚪", labels: { EN: "Sesame",    TH: "งา",               JP: "ごま",          CN: "芝麻" } },
};
const dietInfo: Record<Diet, { icon: string; labels: Partial<Record<Lang, string>> }> = {
  vegan:       { icon: "🌱", labels: { EN: "Vegan",       TH: "วีแกน",       JP: "ヴィーガン",        CN: "纯素" } },
  vegetarian:  { icon: "🥬", labels: { EN: "Vegetarian",  TH: "มังสวิรัติ",   JP: "ベジタリアン",      CN: "素食" } },
  halal:       { icon: "🌙", labels: { EN: "Halal",       TH: "ฮาลาล",       JP: "ハラール",          CN: "清真" } },
  glutenFree:  { icon: "🌾", labels: { EN: "Gluten-free", TH: "ไม่มีกลูเตน",   JP: "グルテンフリー",    CN: "无麸质" } },
};

function getAllergenLabel(a: Allergen, lang: Lang): string {
  return allergenInfo[a].labels[lang] ?? allergenInfo[a].labels.EN ?? a;
}
function getDietLabel(d: Diet, lang: Lang): string {
  return dietInfo[d].labels[lang] ?? dietInfo[d].labels.EN ?? d;
}

const SUPPORTED_LANGS: Array<{ code: Lang; flag: string; name: string }> = [
  { code: "EN", flag: "🇬🇧", name: "English" },
  { code: "TH", flag: "🇹🇭", name: "ไทย" },
  { code: "JP", flag: "🇯🇵", name: "日本語" },
  { code: "CN", flag: "🇨🇳", name: "中文" },
];

const SAMPLE_PROFILES: Array<{ key: PersonaKey; emoji: string; allergens: Allergen[]; diets: Diet[] }> = [
  { key: "sampleAllergyPeanut", emoji: "🥜", allergens: ["peanut"], diets: [] },
  { key: "sampleHalal",         emoji: "🌙", allergens: [], diets: ["halal"] },
  { key: "sampleVegan",         emoji: "🌱", allergens: [], diets: ["vegan"] },
  { key: "sampleAll",           emoji: "⚠️", allergens: ["peanut", "shellfish", "fish", "egg"], diets: [] },
];

// ---------------------------------------------------------------------------
// Profile persistence
// ---------------------------------------------------------------------------

function loadProfile(): StoredProfile {
  if (typeof window === "undefined") {
    return { allergens: [], diets: [], highContrast: false, language: "EN" };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
        diets: Array.isArray(parsed.diets) ? parsed.diets : [],
        highContrast: Boolean(parsed.highContrast),
        language: (parsed.language as Lang) ?? "EN",
      };
    }
  } catch {
    /* ignore */
  }
  return { allergens: [], diets: [], highContrast: false, language: "EN" };
}

function saveProfile(p: StoredProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

// ===========================================================================
// Page
// ===========================================================================

export default function PersonaPage() {
  const [profile, setProfile] = useState<StoredProfile>({
    allergens: [],
    diets: [],
    highContrast: false,
    language: "EN",
  });
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // Persist on change
  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  // Outside-click closes lang dropdown
  useEffect(() => {
    if (!langOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [langOpen]);

  const lang = profile.language;

  const toggleAllergen = (a: Allergen) =>
    setProfile((p) => ({
      ...p,
      allergens: p.allergens.includes(a) ? p.allergens.filter((x) => x !== a) : [...p.allergens, a],
    }));

  const toggleDiet = (d: Diet) =>
    setProfile((p) => ({
      ...p,
      diets: p.diets.includes(d) ? p.diets.filter((x) => x !== d) : [...p.diets, d],
    }));

  const applySample = (allergens: Allergen[], diets: Diet[]) =>
    setProfile((p) => ({ ...p, allergens, diets }));

  const setLang = (l: Lang) => {
    setProfile((p) => ({ ...p, language: l }));
    setLangOpen(false);
  };

  const total = profile.allergens.length + profile.diets.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============================================================
          Sticky navbar (matches scanner: kindee + 3-item nav + Sign in + Lang)
         ============================================================ */}
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/" aria-label="Back to kindee landing" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Utensils size={16} className="text-primary" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-secondary">kindee</span>
          </a>

          <nav
            aria-label="Scanner sections"
            className="hidden md:flex items-center gap-1 rounded-full p-1 bg-secondary/5 border border-border"
          >
            <a
              href="/scan"
              className="text-sm font-bold transition px-3.5 py-1.5 rounded-full text-secondary/70 hover:text-secondary hover:bg-secondary/10"
            >
              {tp(lang, "navScanner")}
            </a>
            <a
              href="/persona"
              className="text-sm font-bold transition px-3.5 py-1.5 rounded-full bg-white text-primary shadow-sm"
            >
              {tp(lang, "navPersona")}
            </a>
            <a
              href="/scan"
              className="text-sm font-bold transition px-3.5 py-1.5 rounded-full text-secondary/70 hover:text-secondary hover:bg-secondary/10"
            >
              {tp(lang, "navPhrase")}
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/login"
              className="hidden sm:inline-flex items-center text-sm font-bold text-secondary/80 hover:text-secondary transition px-3 py-2 rounded-full hover:bg-secondary/5"
            >
              {tp(lang, "signIn")}
            </a>
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold transition border bg-white text-secondary border-border hover:bg-muted shadow-sm"
                aria-label="Language"
              >
                <LanguagesIcon size={13} />
                <span>{lang}</span>
                <ChevronDown size={12} />
              </button>
              {langOpen ? (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-border bg-white shadow-lift overflow-hidden z-50">
                  {SUPPORTED_LANGS.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLang(l.code)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold transition text-left",
                        l.code === lang ? "bg-primary/10 text-primary" : "text-secondary hover:bg-muted",
                      )}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                      {l.code === lang ? <span className="ml-auto text-xs">✓</span> : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================
          Body — soft hero gradient + centered persona card
         ============================================================ */}
      <main className="relative">
        {/* Soft background — same look as landing hero */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 25% 25%, rgba(6,191,174,0.12) 0%, transparent 60%)," +
              "radial-gradient(ellipse 60% 50% at 75% 70%, rgba(255,107,91,0.06) 0%, transparent 60%)," +
              "linear-gradient(160deg, #ecfeff 0%, #f0fdfa 35%, #f7f9fb 100%)",
          }}
        />
        <div
          className="absolute inset-0 -z-10 pointer-events-none opacity-50"
          style={{
            backgroundImage: "radial-gradient(rgba(6,191,174,0.14) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          {/* Page header */}
          <div className="text-center mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">
              {tp(lang, "pageEyebrow")}
            </p>
            <h1 className="mt-2 text-3xl sm:text-[40px] font-black tracking-tight text-secondary leading-tight">
              {tp(lang, "pageTitle")}
            </h1>
            <p className="mt-3 text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {tp(lang, "pageSub")}
            </p>
          </div>

          {/* Profile card */}
          <div className="rounded-3xl bg-white border border-border shadow-[0_20px_60px_rgba(15,23,42,0.06)] p-6 sm:p-8">
            {/* Allergens */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                  {tp(lang, "allergensHeader")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{tp(lang, "allergensSub")}</p>
              </div>
              {total > 0 ? (
                <Badge className="bg-primary/10 text-primary border-0 text-xs">
                  {total} {tp(lang, "selected")}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 mb-7">
              {(Object.keys(allergenInfo) as Allergen[]).map((a) => {
                const active = profile.allergens.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAllergen(a)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-white text-secondary border-border hover:border-primary/50",
                    )}
                  >
                    <span className="text-lg">{allergenInfo[a].icon}</span>
                    <span>{getAllergenLabel(a, lang)}</span>
                  </button>
                );
              })}
            </div>

            {/* Diets */}
            <div className="mb-3">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                {tp(lang, "dietsHeader")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{tp(lang, "dietsSub")}</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-7">
              {(Object.keys(dietInfo) as Diet[]).map((d) => {
                const active = profile.diets.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDiet(d)}
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold border transition",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-white text-secondary border-border hover:border-primary/50",
                    )}
                  >
                    <span className="text-lg">{dietInfo[d].icon}</span>
                    <span>{getDietLabel(d, lang)}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick samples */}
            <div className="border-t border-border pt-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                {tp(lang, "samplesHeader")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">{tp(lang, "samplesSub")}</p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROFILES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => applySample([...s.allergens], [...s.diets])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-border bg-muted/40 text-secondary hover:border-primary hover:bg-primary/5 transition"
                  >
                    <span>{s.emoji}</span>
                    <span>{tp(lang, s.key)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer summary + CTAs */}
            <div className="border-t border-border mt-6 pt-5">
              {total === 0 ? (
                <p className="text-xs text-muted-foreground italic mb-4 text-center">
                  {tp(lang, "nothingSelected")}
                </p>
              ) : null}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5">
                <Button asChild size="lg" className="w-full justify-center rounded-2xl">
                  <a href="/scan">
                    {tp(lang, "saveAndScan")}
                    <ArrowRight size={16} />
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto justify-center rounded-2xl"
                >
                  <a href="/scan">{tp(lang, "skip")}</a>
                </Button>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="text-primary" />
            <span>{tp(lang, "disclaimer")}</span>
          </div>
        </div>
      </main>
    </div>
  );
}

