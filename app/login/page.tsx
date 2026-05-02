"use client";

import {
  Eye,
  EyeOff,
  Languages as LanguagesIcon,
  Lock,
  Mail,
  ChevronDown,
  Utensils,
  ChevronLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types + i18n (mirror of landing — kept local so /login is standalone)
// ---------------------------------------------------------------------------

type Lang = "EN" | "TH" | "JP" | "CN" | "KR" | "AR";
const STORAGE_KEY = "thai-safe-bite-profile";

type StoredProfile = {
  allergens: string[];
  diets: string[];
  highContrast: boolean;
  language: Lang;
};

const loginCopy = {
  EN: {
    welcomeBack: "Welcome back",
    welcomeSub: "Sign in to save your profile and history.",
    createAccount: "Create an account",
    createSub: "Sign up to scan menus on every device.",
    firstName: "First name",
    surname: "Surname",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "••••••••",
    forgotPassword: "Forgot password?",
    rememberMe: "Remember me for 30 days",
    signIn: "Sign in",
    signUp: "Create account",
    or: "Or",
    google: "Continue with Google",
    noAccount: "Don't have an account?",
    haveAccount: "Already have an account?",
    toggleSignUp: "Sign up",
    toggleLogin: "Log in",
    backHome: "Back to home",
    asGuest: "Continue as guest",
    asGuestSub: "No signup needed — try the scanner now.",
    heroTitle: "Eat Thai street food, safely.",
    heroSub: "Built with travelers, vendors, and food allergies in mind. Personalised in your language.",
    poweredBy: "© 2026 kindee — SuperAI Hackathon demo",
  },
  TH: {
    welcomeBack: "ยินดีต้อนรับกลับ",
    welcomeSub: "เข้าสู่ระบบเพื่อบันทึกโปรไฟล์และประวัติ",
    createAccount: "สร้างบัญชีใหม่",
    createSub: "สมัครเพื่อใช้สแกนเมนูได้ทุกอุปกรณ์",
    firstName: "ชื่อ",
    surname: "นามสกุล",
    emailLabel: "อีเมล",
    emailPlaceholder: "you@example.com",
    passwordLabel: "รหัสผ่าน",
    passwordPlaceholder: "••••••••",
    forgotPassword: "ลืมรหัสผ่าน?",
    rememberMe: "จดจำฉันไว้ 30 วัน",
    signIn: "เข้าสู่ระบบ",
    signUp: "สร้างบัญชี",
    or: "หรือ",
    google: "เข้าใช้ด้วย Google",
    noAccount: "ยังไม่มีบัญชี?",
    haveAccount: "มีบัญชีอยู่แล้ว?",
    toggleSignUp: "สมัครเลย",
    toggleLogin: "เข้าสู่ระบบ",
    backHome: "กลับหน้าแรก",
    asGuest: "เข้าใช้แบบ guest",
    asGuestSub: "ไม่ต้องสมัคร — ลองใช้ scanner ได้ทันที",
    heroTitle: "กินสตรีทฟู้ดไทยอย่างปลอดภัย",
    heroSub: "ออกแบบเพื่อนักท่องเที่ยว แม่ค้า และคนแพ้อาหาร — ปรับเป็นภาษาของคุณ",
    poweredBy: "© 2026 kindee — เดโม่ SuperAI Hackathon",
  },
  JP: {
    welcomeBack: "おかえりなさい",
    welcomeSub: "サインインしてプロフィールと履歴を保存。",
    createAccount: "アカウントを作成",
    createSub: "サインアップしてどのデバイスでもメニューをスキャン。",
    firstName: "名",
    surname: "姓",
    emailLabel: "メールアドレス",
    emailPlaceholder: "you@example.com",
    passwordLabel: "パスワード",
    passwordPlaceholder: "••••••••",
    forgotPassword: "パスワードをお忘れですか?",
    rememberMe: "30日間ログイン状態を保持",
    signIn: "サインイン",
    signUp: "アカウントを作成",
    or: "または",
    google: "Google で続行",
    noAccount: "アカウントをお持ちでない方は?",
    haveAccount: "すでにアカウントをお持ちですか?",
    toggleSignUp: "新規登録",
    toggleLogin: "ログイン",
    backHome: "ホームに戻る",
    asGuest: "ゲストとして続行",
    asGuestSub: "登録不要 — 今すぐスキャナーをお試しください。",
    heroTitle: "タイの屋台料理を、安全に。",
    heroSub: "旅行者、店員、食物アレルギーを念頭に設計。あなたの言語に対応。",
    poweredBy: "© 2026 kindee — SuperAI ハッカソンデモ",
  },
  CN: {
    welcomeBack: "欢迎回来",
    welcomeSub: "登录以保存档案和历史记录。",
    createAccount: "创建账户",
    createSub: "注册即可在任何设备上扫描菜单。",
    firstName: "名",
    surname: "姓",
    emailLabel: "邮箱地址",
    emailPlaceholder: "you@example.com",
    passwordLabel: "密码",
    passwordPlaceholder: "••••••••",
    forgotPassword: "忘记密码?",
    rememberMe: "记住我 30 天",
    signIn: "登录",
    signUp: "创建账户",
    or: "或",
    google: "使用 Google 继续",
    noAccount: "还没有账户?",
    haveAccount: "已有账户?",
    toggleSignUp: "注册",
    toggleLogin: "登录",
    backHome: "返回首页",
    asGuest: "以访客身份继续",
    asGuestSub: "无需注册 — 立即试用扫描器。",
    heroTitle: "安心吃泰国街头小吃。",
    heroSub: "为旅客、摊主和食物过敏者设计 — 用你的语言。",
    poweredBy: "© 2026 kindee — SuperAI 黑客松演示",
  },
  KR: {},
  AR: {},
} as const;

type LoginKey = keyof (typeof loginCopy)["EN"];

function tl(lang: Lang, key: LoginKey): string {
  const dict = loginCopy[lang] as Partial<Record<LoginKey, string>>;
  return dict?.[key] ?? loginCopy.EN[key] ?? String(key);
}

const SUPPORTED_LANGS: Array<{ code: Lang; flag: string; name: string }> = [
  { code: "EN", flag: "🇬🇧", name: "English" },
  { code: "TH", flag: "🇹🇭", name: "ไทย" },
  { code: "JP", flag: "🇯🇵", name: "日本語" },
  { code: "CN", flag: "🇨🇳", name: "中文" },
];

// Hero image — Thai street food market (Unsplash, free use)
const HERO_IMG =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLangState] = useState<Lang>("EN");
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Hydrate language from shared profile.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoredProfile>;
        if (parsed.language) setLangState(parsed.language as Lang);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    setLangOpen(false);
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const profile: StoredProfile = raw
        ? JSON.parse(raw)
        : { allergens: [], diets: [], highContrast: false, language: l };
      profile.language = l;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  };

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!langRef.current?.contains(e.target as Node)) setLangOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [langOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // Demo only — pretend to authenticate then go to /scan.
    window.setTimeout(() => router.push("/scan"), 500);
  };

  return (
    <div className="min-h-screen flex w-full bg-white text-foreground">
      {/* ============================================================
          Left column — branding (hidden on mobile)
         ============================================================ */}
      <aside className="hidden lg:flex flex-col relative w-1/2 bg-secondary overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMG}
          alt="Thai street food market at dusk"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, rgba(17,24,39,0.78) 0%, rgba(15,23,42,0.70) 50%, rgba(8,15,28,0.88) 100%)",
          }}
        />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: "radial-gradient(rgba(6,191,174,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 p-12 h-full flex flex-col justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 w-fit" aria-label="Back to kindee home">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Utensils size={16} className="text-primary" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">kindee</span>
          </a>

          {/* Inspirational text */}
          <div className="max-w-md">
            <h1 className="text-4xl font-black text-white leading-[1.1] mb-4 tracking-tight">
              {tl(lang, "heroTitle")}
            </h1>
            <p className="text-[15px] text-white/75 leading-relaxed font-medium">
              {tl(lang, "heroSub")}
            </p>
          </div>

          {/* Footer */}
          <div className="text-[12px] font-semibold text-white/45">
            {tl(lang, "poweredBy")}
          </div>
        </div>
      </aside>

      {/* ============================================================
          Right column — login form
         ============================================================ */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile compact logo (top-left) */}
        <a
          href="/"
          aria-label="Back to kindee home"
          className="absolute top-6 left-6 lg:hidden flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Utensils size={14} className="text-primary" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-secondary">kindee</span>
        </a>

        {/* Top-right: back-home + language picker */}
        <div className="absolute top-6 right-6 flex items-center gap-2">
          <a
            href="/"
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-secondary/60 hover:text-secondary transition px-3 py-2 rounded-full hover:bg-secondary/5"
          >
            <ChevronLeft size={14} />
            {tl(lang, "backHome")}
          </a>
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen(!langOpen)}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-bold transition border bg-white text-secondary border-border hover:bg-muted"
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

        <div className="w-full max-w-[420px] mt-16 sm:mt-0">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-[28px] font-black text-secondary tracking-tight mb-2 leading-tight">
              {isLogin ? tl(lang, "welcomeBack") : tl(lang, "createAccount")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isLogin ? tl(lang, "welcomeSub") : tl(lang, "createSub")}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label={tl(lang, "firstName")}>
                  <input
                    type="text"
                    placeholder="Anya"
                    className="w-full bg-transparent text-sm text-secondary placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </FormField>
                <FormField label={tl(lang, "surname")}>
                  <input
                    type="text"
                    placeholder="Tanaka"
                    className="w-full bg-transparent text-sm text-secondary placeholder:text-muted-foreground/50 focus:outline-none"
                  />
                </FormField>
              </div>
            ) : null}

            <FormField label={tl(lang, "emailLabel")} icon={<Mail size={16} className="text-muted-foreground" />}>
              <input
                type="email"
                required
                placeholder={tl(lang, "emailPlaceholder")}
                className="w-full bg-transparent text-sm text-secondary placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </FormField>

            <FormField
              label={tl(lang, "passwordLabel")}
              icon={<Lock size={16} className="text-muted-foreground" />}
              labelExtra={
                isLogin ? (
                  <a
                    href="#"
                    className="text-[12px] font-bold text-primary hover:opacity-80 transition"
                  >
                    {tl(lang, "forgotPassword")}
                  </a>
                ) : null
              }
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-secondary transition focus:outline-none"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            >
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder={tl(lang, "passwordPlaceholder")}
                className="w-full bg-transparent text-sm text-secondary placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </FormField>

            {isLogin ? (
              <label className="flex items-center gap-2 pt-1 pb-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                />
                <span className="text-[13px] text-muted-foreground">{tl(lang, "rememberMe")}</span>
              </label>
            ) : null}

            <Button type="submit" className="w-full justify-center rounded-2xl mt-2" size="lg" disabled={submitting}>
              {submitting ? "..." : isLogin ? tl(lang, "signIn") : tl(lang, "signUp")}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-7">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              {tl(lang, "or")}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Social */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white border border-border text-secondary font-bold text-sm py-3 rounded-2xl hover:bg-muted transition focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2"
          >
            <GoogleIcon />
            {tl(lang, "google")}
          </button>

          {/* Continue as guest */}
          <a
            href="/scan"
            className="mt-4 block w-full text-center rounded-2xl border border-dashed border-border px-4 py-3 hover:border-primary hover:bg-primary/5 transition"
          >
            <span className="block text-sm font-bold text-secondary">{tl(lang, "asGuest")}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">{tl(lang, "asGuestSub")}</span>
          </a>

          {/* Toggle login/signup */}
          <p className="mt-8 text-center text-[13.5px] text-muted-foreground">
            {isLogin ? tl(lang, "noAccount") : tl(lang, "haveAccount")}{" "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="font-bold text-primary hover:opacity-80 transition focus:outline-none"
            >
              {isLogin ? tl(lang, "toggleSignUp") : tl(lang, "toggleLogin")}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form field — input wrapper with label, icon, optional trailing button.
// ---------------------------------------------------------------------------

function FormField({
  label,
  labelExtra,
  icon,
  trailing,
  children,
}: {
  label: string;
  labelExtra?: React.ReactNode;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[13px] font-bold text-secondary/80">{label}</label>
        {labelExtra}
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted border border-transparent transition focus-within:bg-white focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
        {icon}
        <div className="flex-1 min-w-0">{children}</div>
        {trailing}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Google icon — colored brand glyph
// ---------------------------------------------------------------------------

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
