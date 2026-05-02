"use client";

import {
  ArrowRight,
  Camera,
  ChevronDown,
  Languages as LanguagesIcon,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types — minimal duplication of scanner types (landing is intentionally
// standalone so it doesn't import the giant /scan module).
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

const landingCopy = {
  EN: {
    eyebrow: "AI-Powered Food Safety",
    headline1: "Eat Thai street food,",
    headline2Underlined: "safely",
    sub: "AI scans menus, flags allergens, and generates a Thai phrase card for the vendor — in your language.",
    pickProfile: "Pick what to watch out for",
    pickProfileSub: "Tap any allergen or diet — we save it for the scanner.",
    allergensHeader: "Allergens",
    dietsHeader: "Diet",
    trySample: "Or try a sample:",
    sampleAllergyPeanut: "Peanut allergy",
    sampleHalal: "Halal",
    sampleVegan: "Vegan",
    ctaPrimary: "Open menu scanner",
    ctaSecondary: "View sample scan",
    howItWorksEyebrow: "How it works",
    howItWorks: "Three taps to a safer order",
    step1Title: "Snap a menu",
    step1Desc: "Upload any Thai street menu photo. OCR pulls every item, no typing.",
    step2Title: "See risks instantly",
    step2Desc: "Color-coded ingredients matched to your profile. High / Medium / Low at a glance.",
    step3Title: "Show the vendor a Thai card",
    step3Desc: "Personalised Avoid list + tap-to-answer questions, all in Thai for the vendor.",
    languagesEyebrow: "Multilingual",
    languagesHeader: "Speaks 4 languages",
    languagesSub: "AI replies in your language. The vendor card stays in Thai so the seller can read it.",
    coverageEyebrow: "Coverage",
    coverageHeader: "Allergens & diets we cover",
    samplePreviewEyebrow: "Preview",
    samplePreviewHeader: "What the scanner shows",
    samplePreviewSub: "Risk-sorted, profile-aware. Same shape as the real scanner.",
    finalCtaTitle: "Ready to eat with confidence?",
    finalCtaSub: "Free, no signup. Works on your phone at the night market.",
    footerTag: "Demo for SuperAI Hackathon",
    navHowItWorks: "How it works",
    navLanguages: "Languages",
    navCoverage: "Coverage",
    navOpenScanner: "Open scanner",
    pressEnter: "Tap a chip then press Open scanner",
  },
  TH: {
    eyebrow: "AI ตรวจอาหาร",
    headline1: "กินสตรีทฟู้ดไทย",
    headline2Underlined: "อย่างปลอดภัย",
    sub: "AI สแกนเมนู เตือนสิ่งที่แพ้ และสร้างการ์ดประโยคไทยให้ยื่นแม่ค้า — ในภาษาของคุณ",
    pickProfile: "เลือกสิ่งที่ต้องระวัง",
    pickProfileSub: "แตะ allergen หรือ diet — เราเก็บไว้ใช้ใน scanner",
    allergensHeader: "อาหารที่แพ้",
    dietsHeader: "ข้อจำกัดอาหาร",
    trySample: "หรือลองโปรไฟล์ตัวอย่าง:",
    sampleAllergyPeanut: "แพ้ถั่วลิสง",
    sampleHalal: "ฮาลาล",
    sampleVegan: "วีแกน",
    ctaPrimary: "เปิด menu scanner",
    ctaSecondary: "ดูตัวอย่างผลสแกน",
    howItWorksEyebrow: "วิธีใช้",
    howItWorks: "สามขั้นตอนสู่การสั่งที่ปลอดภัยกว่า",
    step1Title: "ถ่ายรูปเมนู",
    step1Desc: "อัปโหลดรูปป้ายเมนูไทย OCR ดึงทุกรายการให้ ไม่ต้องพิมพ์",
    step2Title: "เห็นความเสี่ยงทันที",
    step2Desc: "ส่วนผสมไฮไลต์สีตามโปรไฟล์ — High / Medium / Low เห็นปุ๊บรู้ปั๊บ",
    step3Title: "ยื่นการ์ดไทยให้แม่ค้า",
    step3Desc: "รายการ Avoid พร้อมคำถามให้แม่ค้าแตะตอบ ทั้งหมดเป็นภาษาไทย",
    languagesEyebrow: "หลายภาษา",
    languagesHeader: "พูดได้ 4 ภาษา",
    languagesSub: "AI ตอบเป็นภาษาของคุณ ส่วนการ์ดให้แม่ค้ายังเป็นภาษาไทยเสมอ",
    coverageEyebrow: "ครอบคลุม",
    coverageHeader: "Allergen และ Diet ที่รองรับ",
    samplePreviewEyebrow: "ตัวอย่าง",
    samplePreviewHeader: "หน้าตาผลการสแกน",
    samplePreviewSub: "เรียงตามความเสี่ยง คำนวณจากโปรไฟล์ — แบบเดียวกับ scanner จริง",
    finalCtaTitle: "พร้อมกินอย่างมั่นใจหรือยัง?",
    finalCtaSub: "ฟรี ไม่ต้องสมัคร ใช้บนมือถือได้เลยที่ตลาด",
    footerTag: "เดโม่สำหรับ SuperAI Hackathon",
    navHowItWorks: "วิธีใช้",
    navLanguages: "ภาษา",
    navCoverage: "ครอบคลุม",
    navOpenScanner: "เปิด scanner",
    pressEnter: "แตะ chip แล้วกด Open scanner",
  },
  JP: {
    eyebrow: "AI フードセーフティ",
    headline1: "タイの屋台料理を、",
    headline2Underlined: "安全に",
    sub: "AI がメニューをスキャンし、アレルゲンを警告し、店員に渡せるタイ語フレーズカードを作成します — あなたの言語で。",
    pickProfile: "気をつけたいものを選択",
    pickProfileSub: "アレルゲンや食事制限をタップ — スキャナーに保存されます。",
    allergensHeader: "アレルギー",
    dietsHeader: "食事制限",
    trySample: "サンプルプロフィールを試す:",
    sampleAllergyPeanut: "ピーナッツアレルギー",
    sampleHalal: "ハラール",
    sampleVegan: "ヴィーガン",
    ctaPrimary: "メニュースキャナーを開く",
    ctaSecondary: "サンプルスキャンを見る",
    howItWorksEyebrow: "使い方",
    howItWorks: "3 タップで安心の注文",
    step1Title: "メニューを撮る",
    step1Desc: "タイのメニュー写真をアップロード。OCR がすべての項目を抽出します。",
    step2Title: "リスクを即座に確認",
    step2Desc: "プロフィールに合わせて色分けされた材料。High / Medium / Low が一目で。",
    step3Title: "店員にタイ語カードを見せる",
    step3Desc: "パーソナライズされた回避リスト + タップ式の質問、すべてタイ語で。",
    languagesEyebrow: "多言語対応",
    languagesHeader: "4 言語に対応",
    languagesSub: "AI はあなたの言語で返答。店員カードはタイ語のままなので、店員が読めます。",
    coverageEyebrow: "対応範囲",
    coverageHeader: "対応するアレルゲンと食事制限",
    samplePreviewEyebrow: "プレビュー",
    samplePreviewHeader: "スキャナーの表示",
    samplePreviewSub: "リスク順、プロフィール対応。実際のスキャナーと同じ形式。",
    finalCtaTitle: "自信を持って食べる準備はいいですか?",
    finalCtaSub: "無料、登録不要。夜市でスマホからすぐ使えます。",
    footerTag: "SuperAI ハッカソン用デモ",
    navHowItWorks: "使い方",
    navLanguages: "言語",
    navCoverage: "対応範囲",
    navOpenScanner: "スキャナーを開く",
    pressEnter: "チップをタップしてスキャナーを開く",
  },
  CN: {
    eyebrow: "AI 食品安全",
    headline1: "安心吃泰国",
    headline2Underlined: "街头小吃",
    sub: "AI 扫描菜单、标记过敏原,并生成可以给摊主看的泰语短语卡 — 用你的语言。",
    pickProfile: "选择需要注意的项目",
    pickProfileSub: "点击任何过敏原或饮食限制 — 我们会保存到扫描器。",
    allergensHeader: "过敏原",
    dietsHeader: "饮食限制",
    trySample: "或试试示例档案:",
    sampleAllergyPeanut: "花生过敏",
    sampleHalal: "清真",
    sampleVegan: "纯素",
    ctaPrimary: "打开菜单扫描器",
    ctaSecondary: "查看示例扫描",
    howItWorksEyebrow: "使用方法",
    howItWorks: "三步轻松点更安心的菜",
    step1Title: "拍下菜单",
    step1Desc: "上传任何泰国街头菜单照片,OCR 提取所有项目,无需打字。",
    step2Title: "立即看到风险",
    step2Desc: "成分按你的档案彩色高亮。High / Medium / Low 一目了然。",
    step3Title: "给摊主看泰语卡",
    step3Desc: "个性化的回避列表 + 摊主点击回答的问题,全部以泰语呈现。",
    languagesEyebrow: "多语言",
    languagesHeader: "支持 4 种语言",
    languagesSub: "AI 用你的语言回复。摊主卡保持泰语,方便摊主阅读。",
    coverageEyebrow: "覆盖范围",
    coverageHeader: "支持的过敏原与饮食限制",
    samplePreviewEyebrow: "预览",
    samplePreviewHeader: "扫描器界面",
    samplePreviewSub: "按风险排序,匹配档案。与实际扫描器相同。",
    finalCtaTitle: "准备好放心吃了吗?",
    finalCtaSub: "免费,无需注册。在夜市用手机就能扫。",
    footerTag: "SuperAI 黑客松演示",
    navHowItWorks: "使用方法",
    navLanguages: "语言",
    navCoverage: "覆盖范围",
    navOpenScanner: "打开扫描器",
    pressEnter: "选择标签后点击打开扫描器",
  },
  KR: {},
  AR: {},
} as const;

type LandingKey = keyof (typeof landingCopy)["EN"];

function tl(lang: Lang, key: LandingKey): string {
  const dict = landingCopy[lang] as Partial<Record<LandingKey, string>>;
  return dict?.[key] ?? landingCopy.EN[key] ?? String(key);
}

// ---------------------------------------------------------------------------
// Allergen / diet labels — small subset duplicated so landing stays standalone.
// ---------------------------------------------------------------------------

const allergenLabel: Record<Allergen, { icon: string; labels: Partial<Record<Lang, string>> }> = {
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

const dietLabel: Record<Diet, { icon: string; labels: Partial<Record<Lang, string>> }> = {
  vegan:       { icon: "🌱", labels: { EN: "Vegan",       TH: "วีแกน",       JP: "ヴィーガン",        CN: "纯素" } },
  vegetarian:  { icon: "🥬", labels: { EN: "Vegetarian",  TH: "มังสวิรัติ",   JP: "ベジタリアン",      CN: "素食" } },
  halal:       { icon: "🌙", labels: { EN: "Halal",       TH: "ฮาลาล",       JP: "ハラール",          CN: "清真" } },
  glutenFree:  { icon: "🌾", labels: { EN: "Gluten-free", TH: "ไม่มีกลูเตน",   JP: "グルテンフリー",    CN: "无麸质" } },
};

function getAllergenLabel(a: Allergen, lang: Lang): string {
  return allergenLabel[a].labels[lang] ?? allergenLabel[a].labels.EN ?? a;
}
function getDietLabel(d: Diet, lang: Lang): string {
  return dietLabel[d].labels[lang] ?? dietLabel[d].labels.EN ?? d;
}

const SAMPLE_PROFILES: Array<{ key: string; tlKey: LandingKey; allergens: Allergen[]; diets: Diet[]; emoji: string }> = [
  { key: "peanut", tlKey: "sampleAllergyPeanut", allergens: ["peanut"], diets: [], emoji: "🥜" },
  { key: "halal",  tlKey: "sampleHalal",         allergens: [], diets: ["halal"], emoji: "🌙" },
  { key: "vegan",  tlKey: "sampleVegan",         allergens: [], diets: ["vegan"], emoji: "🌱" },
];

const SUPPORTED_LANGS: Array<{ code: Lang; flag: string; name: string }> = [
  { code: "EN", flag: "🇬🇧", name: "English" },
  { code: "TH", flag: "🇹🇭", name: "ไทย" },
  { code: "JP", flag: "🇯🇵", name: "日本語" },
  { code: "CN", flag: "🇨🇳", name: "中文" },
];

// ---------------------------------------------------------------------------
// Profile persistence (shared with /scan).
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
    // ignore parse errors
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

export default function LandingPage() {
  const [profile, setProfile] = useState<StoredProfile>(() => ({
    allergens: [],
    diets: [],
    highContrast: false,
    language: "EN",
  }));
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const lang = profile.language;

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  // Persist whenever profile changes (post-hydration).
  useEffect(() => {
    if (typeof window === "undefined") return;
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [langOpen]);

  const toggleAllergen = (a: Allergen) =>
    setProfile((p) => ({
      ...p,
      allergens: p.allergens.includes(a)
        ? p.allergens.filter((x) => x !== a)
        : [...p.allergens, a],
    }));

  const toggleDiet = (d: Diet) =>
    setProfile((p) => ({
      ...p,
      diets: p.diets.includes(d) ? p.diets.filter((x) => x !== d) : [...p.diets, d],
    }));

  const applySample = (allergens: Allergen[], diets: Diet[]) => {
    setProfile((p) => ({ ...p, allergens, diets }));
  };

  const setLang = (l: Lang) => {
    setProfile((p) => ({ ...p, language: l }));
    setLangOpen(false);
  };

  const profileCount = profile.allergens.length + profile.diets.length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        scrolled={scrolled}
        lang={lang}
        langOpen={langOpen}
        setLangOpen={setLangOpen}
        setLang={setLang}
        langRef={langRef}
      />

      <Hero
        lang={lang}
        profile={profile}
        toggleAllergen={toggleAllergen}
        toggleDiet={toggleDiet}
        applySample={applySample}
        profileCount={profileCount}
      />

      <HowItWorks lang={lang} />

      <LanguagesSection lang={lang} active={lang} setLang={setLang} />

      <CoverageSection lang={lang} />

      <SamplePreview lang={lang} />

      <FinalCta lang={lang} profileCount={profileCount} />

      <Footer lang={lang} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navbar
// ---------------------------------------------------------------------------

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
  setLangOpen: (v: boolean) => void;
  setLang: (l: Lang) => void;
  langRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/92 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent",
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary transition">
              <Utensils size={16} className="text-primary" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-secondary transition-colors">
              kindee
            </span>
          </a>

          <div className="hidden md:flex items-center gap-1 rounded-full p-1 bg-white/80 backdrop-blur-sm border border-border shadow-sm">
            {[
              { href: "#how-it-works", label: tl(lang, "navHowItWorks") },
              { href: "#languages", label: tl(lang, "navLanguages") },
              { href: "#coverage", label: tl(lang, "navCoverage") },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-secondary/80 hover:text-secondary hover:bg-secondary/10 transition px-3.5 py-1.5 rounded-full"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language picker */}
            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold transition border bg-white/80 backdrop-blur-sm text-secondary border-border shadow-sm hover:bg-white"
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
                        l.code === lang
                          ? "bg-primary/10 text-primary"
                          : "text-secondary hover:bg-muted",
                      )}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                      {l.code === lang ? (
                        <span className="ml-auto text-xs">✓</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <a
              href="/login"
              className="hidden sm:inline-flex items-center text-sm font-bold text-secondary/80 hover:text-secondary transition px-3 py-2 rounded-full hover:bg-secondary/5"
            >
              {lang === "TH" ? "เข้าสู่ระบบ" : lang === "JP" ? "ログイン" : lang === "CN" ? "登录" : "Sign in"}
            </a>

            <Button asChild size="sm" className="rounded-full hidden sm:inline-flex">
              <a href="/scan">
                {tl(lang, "navOpenScanner")}
                <ArrowRight size={14} />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({
  lang,
  profile,
  toggleAllergen,
  toggleDiet,
  applySample,
  profileCount,
}: {
  lang: Lang;
  profile: StoredProfile;
  toggleAllergen: (a: Allergen) => void;
  toggleDiet: (d: Diet) => void;
  applySample: (allergens: Allergen[], diets: Diet[]) => void;
  profileCount: number;
}) {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      {/* Layered dark background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 25% 35%, rgba(6,191,174,0.18) 0%, transparent 60%)," +
            "radial-gradient(ellipse 60% 50% at 75% 70%, rgba(255,107,91,0.10) 0%, transparent 60%)," +
            "linear-gradient(160deg, #ecfeff 0%, #f0fdfa 35%, #f7f9fb 100%)",
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none opacity-70"
        style={{
          backgroundImage: "radial-gradient(rgba(6,191,174,0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Floating orbs */}
      <div className="absolute top-[10%] left-[5%] w-72 h-72 rounded-full -z-10 pointer-events-none orb-float" style={{ background: "rgba(6,191,174,0.18)", filter: "blur(60px)" }} />
      <div className="absolute bottom-[15%] right-[10%] w-52 h-52 rounded-full -z-10 pointer-events-none orb-float" style={{ background: "rgba(255,107,91,0.14)", filter: "blur(60px)", animationDelay: "-6s", animationDuration: "22s" }} />
      <div className="absolute top-[50%] left-[55%] w-60 h-60 rounded-full -z-10 pointer-events-none orb-float" style={{ background: "rgba(6,191,174,0.12)", filter: "blur(60px)", animationDelay: "-12s", animationDuration: "25s" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-primary/20 shadow-sm mb-6">
          <Sparkles size={13} className="text-primary" />
          <span className="text-[11px] font-black text-primary tracking-widest uppercase">
            {tl(lang, "eyebrow")}
          </span>
        </div>

        <h1 className="text-[clamp(2.4rem,6vw,4.4rem)] font-black text-secondary leading-[1.06] tracking-tight mb-5">
          {tl(lang, "headline1")}{" "}
          <span className="relative inline-block">
            {tl(lang, "headline2Underlined")}
            <svg
              className="absolute -bottom-1 left-0 w-full"
              height="6"
              viewBox="0 0 200 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M0 5C50 0 150 0 200 5" stroke="url(#kindee-underline)" strokeWidth="2.5" strokeLinecap="round" />
              <defs>
                <linearGradient id="kindee-underline" x1="0" y1="5" x2="200" y2="5">
                  <stop stopColor="#06BFAE" stopOpacity="1" />
                  <stop offset="1" stopColor="#06BFAE" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          .
        </h1>

        <p className="text-base sm:text-lg text-secondary/65 max-w-xl mx-auto mb-10 leading-relaxed font-medium">
          {tl(lang, "sub")}
        </p>

        {/* Profile picker card */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-5 sm:p-6 text-left">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {tl(lang, "pickProfile")}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{tl(lang, "pickProfileSub")}</p>
            </div>
            {profileCount > 0 ? (
              <Badge className="bg-primary/10 text-primary border-0 text-xs">
                {profileCount} selected
              </Badge>
            ) : null}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">
            {tl(lang, "allergensHeader")}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(Object.keys(allergenLabel) as Allergen[]).map((a) => {
              const active = profile.allergens.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAllergen(a)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white text-secondary border-border hover:border-primary/50",
                  )}
                >
                  <span>{allergenLabel[a].icon}</span>
                  <span>{getAllergenLabel(a, lang)}</span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">
            {tl(lang, "dietsHeader")}
          </p>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {(Object.keys(dietLabel) as Diet[]).map((d) => {
              const active = profile.diets.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDiet(d)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-white text-secondary border-border hover:border-primary/50",
                  )}
                >
                  <span>{dietLabel[d].icon}</span>
                  <span>{getDietLabel(d, lang)}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <span className="text-xs font-semibold text-muted-foreground shrink-0">
              {tl(lang, "trySample")}
            </span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {SAMPLE_PROFILES.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => applySample(s.allergens, s.diets)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-border bg-muted/40 text-secondary hover:border-primary hover:bg-primary/5 transition"
                >
                  <span>{s.emoji}</span>
                  <span>{tl(lang, s.tlKey)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5">
            <Button asChild size="lg" className="w-full justify-center rounded-2xl">
              <a href="/scan">
                {tl(lang, "ctaPrimary")}
                <ArrowRight size={16} />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto justify-center rounded-2xl">
              <a href="/scan?sample=1">{tl(lang, "ctaSecondary")}</a>
            </Button>
          </div>
        </div>

        <p className="text-xs text-secondary/55 font-semibold mt-4">
          {tl(lang, "pressEnter")}
        </p>
      </div>

      {/* orb keyframes */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0,0) scale(1); }
          25% { transform: translate(15px,-20px) scale(1.05); }
          50% { transform: translate(-10px,15px) scale(0.95); }
          75% { transform: translate(20px,10px) scale(1.02); }
        }
        .orb-float { animation: orbFloat 18s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .orb-float { animation: none; } }
      `}</style>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

function HowItWorks({ lang }: { lang: Lang }) {
  const steps = [
    { icon: Camera, title: tl(lang, "step1Title"), desc: tl(lang, "step1Desc") },
    { icon: ShieldCheck, title: tl(lang, "step2Title"), desc: tl(lang, "step2Desc") },
    { icon: MessageSquare, title: tl(lang, "step3Title"), desc: tl(lang, "step3Desc") },
  ];
  return (
    <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <SectionHeader eyebrow={tl(lang, "howItWorksEyebrow")} title={tl(lang, "howItWorks")} />
      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="rounded-3xl bg-white border border-border p-6 shadow-sm hover:shadow-lift transition"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon size={22} />
                </div>
                <span className="text-xs font-black tracking-wider text-muted-foreground">
                  STEP {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-secondary leading-tight">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Languages section
// ---------------------------------------------------------------------------

function LanguagesSection({
  lang,
  active,
  setLang,
}: {
  lang: Lang;
  active: Lang;
  setLang: (l: Lang) => void;
}) {
  return (
    <section id="languages" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <SectionHeader eyebrow={tl(lang, "languagesEyebrow")} title={tl(lang, "languagesHeader")} sub={tl(lang, "languagesSub")} />
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {SUPPORTED_LANGS.map((l) => {
          const isActive = l.code === active;
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={cn(
                "flex items-center gap-3 px-5 py-3 rounded-2xl border transition text-left",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-lift"
                  : "bg-white text-secondary border-border hover:border-primary/50 hover:shadow-sm",
              )}
            >
              <span className="text-2xl">{l.flag}</span>
              <div>
                <div className="text-sm font-extrabold leading-none">{l.name}</div>
                <div className={cn("text-xs font-semibold mt-1", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {l.code}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Coverage (allergens + diets)
// ---------------------------------------------------------------------------

function CoverageSection({ lang }: { lang: Lang }) {
  return (
    <section id="coverage" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 scroll-mt-20">
      <SectionHeader eyebrow={tl(lang, "coverageEyebrow")} title={tl(lang, "coverageHeader")} />
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-white border border-border p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary mb-4">
            {tl(lang, "allergensHeader")}
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(allergenLabel) as Allergen[]).map((a) => (
              <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-secondary text-xs font-bold border border-border">
                <span>{allergenLabel[a].icon}</span>
                <span>{getAllergenLabel(a, lang)}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-white border border-border p-6">
          <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary mb-4">
            {tl(lang, "dietsHeader")}
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(dietLabel) as Diet[]).map((d) => (
              <span key={d} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-secondary text-xs font-bold border border-border">
                <span>{dietLabel[d].icon}</span>
                <span>{getDietLabel(d, lang)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sample preview (static caution-table mock)
// ---------------------------------------------------------------------------

const SAMPLE_ROWS = [
  {
    thai: "ผัดกะเพรา",
    en: "Pad Krapow",
    risk: "High" as const,
    riskClass: "bg-rose-100 text-rose-900 border-rose-200",
    chips: ["🦪 Oyster sauce", "🐟 Fish sauce", "🥚 Egg"],
  },
  {
    thai: "ส้มตำ",
    en: "Som Tum",
    risk: "High" as const,
    riskClass: "bg-rose-100 text-rose-900 border-rose-200",
    chips: ["🥜 Peanuts", "🦐 Dried shrimp", "🐟 Fish sauce"],
  },
  {
    thai: "ข้าวเหนียวมะม่วง",
    en: "Mango Sticky Rice",
    risk: "Low" as const,
    riskClass: "bg-emerald-100 text-emerald-900 border-emerald-200",
    chips: ["🥥 Coconut milk"],
  },
];

function SamplePreview({ lang }: { lang: Lang }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <SectionHeader
        eyebrow={tl(lang, "samplePreviewEyebrow")}
        title={tl(lang, "samplePreviewHeader")}
        sub={tl(lang, "samplePreviewSub")}
      />
      <div className="mt-10 rounded-3xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="bg-muted/60 border-b border-border px-5 py-3 flex items-center justify-between">
          <p className="text-xs font-black uppercase tracking-wider text-primary">{tl(lang, "samplePreviewEyebrow")}</p>
          <Badge className="bg-primary text-primary-foreground text-xs">Demo</Badge>
        </div>
        <ul className="divide-y divide-border">
          {SAMPLE_ROWS.map((r) => (
            <li key={r.thai} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="sm:w-48">
                <p className="text-base font-black text-secondary leading-tight">{r.thai}</p>
                <p className="text-xs font-semibold text-muted-foreground mt-0.5">{r.en}</p>
              </div>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {r.chips.map((c) => (
                  <span key={c} className="inline-flex items-center px-2.5 py-1 rounded-full bg-muted text-secondary text-xs font-bold border border-border">
                    {c}
                  </span>
                ))}
              </div>
              <Badge className={cn("text-xs border", r.riskClass)}>
                {r.risk === "High" ? "🔴" : "🟢"} {r.risk}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

function FinalCta({ lang, profileCount }: { lang: Lang; profileCount: number }) {
  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="rounded-3xl bg-secondary text-white p-8 sm:p-12 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 -z-0 pointer-events-none opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(6,191,174,0.18) 0%, transparent 70%)",
          }}
        />
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight relative z-10">
          {tl(lang, "finalCtaTitle")}
        </h2>
        <p className="mt-3 text-base text-white/65 max-w-xl mx-auto relative z-10">
          {tl(lang, "finalCtaSub")}
        </p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center relative z-10">
          <Button asChild size="lg" className="rounded-2xl">
            <a href="/scan">
              {tl(lang, "ctaPrimary")}
              <ArrowRight size={16} />
            </a>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-2xl bg-white/5 text-white border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40">
            <a href="/scan?sample=1">{tl(lang, "ctaSecondary")}</a>
          </Button>
        </div>
        {profileCount > 0 ? (
          <p className="mt-4 text-xs font-semibold text-white/50 relative z-10">
            ✓ {profileCount} item{profileCount === 1 ? "" : "s"} ready in your profile
          </p>
        ) : null}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
              <Utensils size={14} className="text-primary" />
            </div>
            <span className="text-sm font-extrabold text-secondary">kindee</span>
          </div>
          <p className="text-[11px] text-muted-foreground font-semibold">
            {tl(lang, "footerTag")}
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Section header helper
// ---------------------------------------------------------------------------

function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h2 className="mt-2 text-3xl sm:text-[34px] font-black tracking-tight text-secondary leading-tight">
        {title}
      </h2>
      {sub ? <p className="mt-3 text-base text-muted-foreground leading-relaxed">{sub}</p> : null}
    </div>
  );
}
