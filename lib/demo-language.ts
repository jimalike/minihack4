export type DemoLang = "TH" | "EN";

export const DEMO_LANG_STORAGE_KEY = "office-relief-demo-lang";

export function loadDemoLang(): DemoLang {
  if (typeof window === "undefined") return "TH";
  const saved = window.localStorage.getItem(DEMO_LANG_STORAGE_KEY);
  return saved === "EN" ? "EN" : "TH";
}

export function saveDemoLang(lang: DemoLang) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_LANG_STORAGE_KEY, lang);
}
