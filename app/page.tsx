"use client";

import {
  AlertTriangle,
  AudioLines,
  Camera,
  Check,
  ChevronLeft,
  CircleHelp,
  Languages,
  Mic,
  MoonStar,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  Utensils,
  Volume2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
type Risk = "Low" | "Medium" | "High" | "Unknown";
type Confidence = "Low" | "Medium" | "High";
type Mode = "photo" | "voice" | "type";
type Screen = "home" | "result" | "phrase";
type Lang = "EN" | "TH" | "JP" | "CN" | "KR" | "AR";
type SpeechRecognitionResultLike = {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultLike) => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type WindowWithSpeechRecognition = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

type Profile = {
  allergens: Allergen[];
  diets: Diet[];
  highContrast: boolean;
  language: Lang;
};

type ProfileLoadState = "loading" | "api" | "local" | "fallback";

type ApiProfileResponse = {
  profile?: Partial<Profile>;
  traveler?: {
    name?: string;
  };
};

type Ingredient = {
  key: string;
  label: string;
  icon: string;
  flags: Array<Allergen | Diet>;
};

type Dish = {
  id: string;
  thai: string;
  english: string;
  romanized: string;
  category: string;
  baseRisk: Risk;
  confidence: Confidence;
  commonlyContains: Ingredient[];
  hiddenAsks: string[];
  crossContact: string[];
  saferAlternativeIds: string[];
};

type AnalysisResult = {
  dish: Dish;
  risk: Risk;
  riskReasons: string[];
  confidence: Confidence;
};

type MenuCautionRow = {
  id: string;
  thai: string;
  english: string;
  price: string;
  confidence: Confidence;
  likelyContains: Ingredient[];
  cautionNotes: string[];
  askVendor: string;
  matchedDishId?: string;
  proteinOptions?: string[];
};

const STORAGE_KEY = "thai-safe-bite-profile";
const CACHE_KEY = "thai-safe-bite-last-result";

const languageNames: Record<Lang, string> = {
  EN: "English",
  TH: "ไทย",
  JP: "日本語",
  CN: "中文",
  KR: "한국어",
  AR: "العربية",
};

// Master list of i18n keys. EN is the source of truth for shape; other languages
// fall back to EN via the `t()` helper if a key is missing.
const copy = {
  EN: {
    // legacy keys (already used by ResultScreen / PhraseScreen)
    intro: "Let's check together before you eat.",
    disclaimer: "This is not medical advice. Always confirm with the vendor.",
    riskEstimate: "Risk estimate",
    confidence: "Confidence",
    commonlyContains: "Commonly contains",
    hiddenAsks: "Hidden ingredients to ask about",
    crossContact: "Cross-contact to confirm",
    safer: "Safer alternatives",
    phrase: "Thai phrase card",
    vendor: "Vendor reply mode",
    // caution table
    cautionTable: "Caution table",
    menuScanResults: "Menu scan results",
    sortedByRisk: "Sorted by risk for your profile. Tap a row's phrase to ask the vendor before ordering.",
    colMenuItem: "Menu item",
    colPossibleCautions: "Possible cautions",
    colRisk: "Risk",
    colAskVendor: "Ask vendor",
    colAction: "Action",
    review: "Review",
    askOnly: "Ask only",
    chooseProtein: "Choose {safe}. Avoid {avoid}.",
    allProteinsConflict: "All listed proteins ({avoid}) conflict with your profile — ask for an off-menu option.",
    ocrFooterNote: "Menu OCR cannot prove ingredients or cross-contact. Use this table to ask better questions, then confirm with the vendor.",
    // scan UI
    menuScannerEyebrow: "Menu scanner",
    menuScannerTitle: "Scan Thai menus, then ask better questions.",
    menuScannerSub: "Your profile is applied automatically. We estimate risk, then help you confirm with the vendor.",
    uploadMenuPhoto: "Upload a menu photo",
    uploadDescription: "Pick a photo of the menu board and we'll turn it into a caution table you can act on.",
    uploadMenu: "Upload menu",
    removeImage: "Remove image",
    scanMenu: "Scan menu",
    scanning: "Scanning menu…",
    useSampleMenu: "Use sample Thai menu",
    searchPlaceholder: "Optional menu hint, e.g. curry, fried rice",
    noMenuDetected: "No menu items detected. Try a clearer photo of the menu board.",
    scanFailed: "Scan failed",
    cannotReachService: "Could not reach the scan service.",
    pleaseChooseImage: "Please choose an image file (JPG, PNG, HEIC).",
    couldNotReadImage: "Could not read this image. Try another one.",
    tryAgain: "Try again.",
    demoOcr: "Demo OCR",
    // mode tabs
    modeMenu: "Menu",
    modeVoice: "Voice",
    modeType: "Type",
    // profile (api card)
    apiProfileEyebrow: "Your profile",
    foodNeedsApplied: "Food needs applied",
    profileLoading: "Loading",
    profileApi: "API",
    profileLocal: "Local",
    profileFallback: "Fallback",
    profileDemo: "Demo",
    allergensHeader: "Allergens",
    dietsHeader: "Diets",
    noProfileSelected: "No allergens or diets selected yet.",
    // result screen
    backToCheckAnother: "Back to check another dish",
    showThisToVendor: "Show this to the vendor",
    romanizedMeaning: "Romanized meaning",
    playAudio: "Play polite Thai audio",
    yourProfileTitle: "What this phrase checks",
    askThenDecide: "Ask, then decide",
    crossContactNote: "We estimate possible ingredients from common recipes. Street food varies by vendor, and cross-contact can happen with mortars, woks, oil, spoons, and cutting boards.",
    // misc
    offlinePopularDishes: "Offline popular dishes",
    confirmWithVendor: "Always confirm with the vendor.",
    // result screen extras
    possibleMatch: "Possible match with your profile",
    noOfflineCommonIngredients: "No common hidden animal or major allergen ingredient in our offline dish data.",
    openPhraseCard: "Open Thai phrase card",
    playThaiAudio: "Play Thai audio",
    showVendor: "Show vendor",
    tapToFlip: "Tap to flip question",
    lowerRisk: "Lower risk",
    phrasePreview: "Phrase preview",
    vendorContains: "Contains",
    vendorNo: "No",
    vendorNotSure: "Not sure",
  },
  TH: {
    intro: "มาช่วยกันเช็กก่อนทานนะคะ",
    disclaimer: "ข้อมูลนี้ไม่ใช่คำแนะนำทางการแพทย์ โปรดยืนยันกับร้านค้าทุกครั้ง",
    riskEstimate: "ประเมินความเสี่ยง",
    confidence: "ความมั่นใจ",
    commonlyContains: "มักมีส่วนผสม",
    hiddenAsks: "ส่วนผสมแฝงที่ควรถาม",
    crossContact: "การปนเปื้อนข้ามที่ควรถาม",
    safer: "ตัวเลือกที่เสี่ยงน้อยกว่า",
    phrase: "การ์ดประโยคภาษาไทย",
    vendor: "โหมดให้ร้านค้าตอบ",
    cautionTable: "ตารางข้อควรระวัง",
    menuScanResults: "ผลสแกนเมนู",
    sortedByRisk: "เรียงตามระดับความเสี่ยงของโปรไฟล์คุณ แตะประโยคในแถวเพื่อถามแม่ค้าก่อนสั่ง",
    colMenuItem: "เมนู",
    colPossibleCautions: "ข้อควรระวัง",
    colRisk: "ความเสี่ยง",
    colAskVendor: "ถามแม่ค้า",
    colAction: "การจัดการ",
    review: "ดูรายละเอียด",
    askOnly: "ถามเท่านั้น",
    chooseProtein: "เลือก {safe} หลีกเลี่ยง {avoid}",
    allProteinsConflict: "เนื้อสัตว์ที่มีให้ ({avoid}) ขัดกับโปรไฟล์ทั้งหมด — ลองขอเมนูพิเศษนอกเมนู",
    ocrFooterNote: "การ OCR เมนูไม่สามารถยืนยันส่วนผสมหรือการปนเปื้อนข้ามได้ ใช้ตารางนี้เพื่อถามคำถามที่ดีขึ้น แล้วยืนยันกับแม่ค้าอีกครั้ง",
    menuScannerEyebrow: "สแกนเมนู",
    menuScannerTitle: "สแกนเมนูไทย แล้วถามให้ตรงประเด็น",
    menuScannerSub: "ระบบจะนำโปรไฟล์ของคุณมาคำนวณให้อัตโนมัติ แล้วช่วยคุณยืนยันกับแม่ค้า",
    uploadMenuPhoto: "อัปโหลดรูปเมนู",
    uploadDescription: "เลือกรูปป้ายเมนู เราจะแปลงเป็นตารางคำเตือนให้ดู",
    uploadMenu: "อัปโหลดเมนู",
    removeImage: "ลบรูป",
    scanMenu: "สแกนเมนู",
    scanning: "กำลังสแกน…",
    useSampleMenu: "ใช้เมนูไทยตัวอย่าง",
    searchPlaceholder: "พิมพ์ชื่อเมนู เช่น แกง ข้าวผัด",
    noMenuDetected: "ไม่พบรายการเมนู ลองถ่ายรูปป้ายเมนูให้ชัดขึ้น",
    scanFailed: "สแกนไม่สำเร็จ",
    cannotReachService: "ติดต่อบริการสแกนไม่ได้",
    pleaseChooseImage: "กรุณาเลือกไฟล์รูป (JPG, PNG, HEIC)",
    couldNotReadImage: "อ่านรูปนี้ไม่ได้ ลองรูปอื่นนะคะ",
    tryAgain: "ลองอีกครั้ง",
    demoOcr: "OCR ตัวอย่าง",
    modeMenu: "เมนู",
    modeVoice: "เสียง",
    modeType: "พิมพ์",
    apiProfileEyebrow: "โปรไฟล์ของคุณ",
    foodNeedsApplied: "นำข้อจำกัดอาหารมาใช้แล้ว",
    profileLoading: "กำลังโหลด",
    profileApi: "API",
    profileLocal: "เครื่อง",
    profileFallback: "สำรอง",
    profileDemo: "เดโม่",
    allergensHeader: "อาหารที่แพ้",
    dietsHeader: "ข้อจำกัดอาหาร",
    noProfileSelected: "ยังไม่ได้เลือกอาหารที่แพ้หรือข้อจำกัด",
    backToCheckAnother: "กลับไปเช็กเมนูอื่น",
    showThisToVendor: "ยื่นให้แม่ค้าดู",
    romanizedMeaning: "คำแปลภาษาไทย",
    playAudio: "เล่นเสียงประโยคภาษาไทย",
    yourProfileTitle: "ประโยคนี้ตรวจอะไรให้บ้าง",
    askThenDecide: "ถามก่อน แล้วค่อยตัดสินใจ",
    crossContactNote: "เราประเมินส่วนผสมจากสูตรอาหารที่พบบ่อย ร้าน street food แต่ละเจ้าใช้สูตรต่างกัน และอาจมีการปนเปื้อนผ่านครก กระทะ น้ำมัน ช้อน หรือเขียง",
    offlinePopularDishes: "เมนูยอดฮิต (ออฟไลน์)",
    confirmWithVendor: "ยืนยันกับแม่ค้าทุกครั้ง",
    possibleMatch: "อาจตรงกับโปรไฟล์ของคุณ",
    noOfflineCommonIngredients: "ไม่มีส่วนผสมแฝง/อาหารที่แพ้ หลักในฐานข้อมูลออฟไลน์",
    openPhraseCard: "เปิดการ์ดประโยคไทย",
    playThaiAudio: "เล่นเสียงภาษาไทย",
    showVendor: "ส่งให้ร้านดู",
    tapToFlip: "แตะเพื่อเปลี่ยนคำถาม",
    lowerRisk: "เสี่ยงน้อยกว่า",
    phrasePreview: "ตัวอย่างประโยค",
    vendorContains: "ใส่",
    vendorNo: "ไม่ใส่",
    vendorNotSure: "ไม่แน่ใจ",
  },
  JP: {
    intro: "食べる前に一緒に確認しましょう。",
    disclaimer: "これは医療助言ではありません。必ず店員に確認してください。",
    riskEstimate: "リスク推定",
    confidence: "信頼度",
    commonlyContains: "一般的な材料",
    hiddenAsks: "確認したい隠れ材料",
    crossContact: "交差接触の確認",
    safer: "より安全な代替案",
    phrase: "タイ語フレーズカード",
    vendor: "店員返信モード",
    cautionTable: "注意点一覧",
    menuScanResults: "メニュースキャン結果",
    sortedByRisk: "あなたのプロフィールに合わせてリスク順に並べました。注文前に各行のフレーズを店員に見せて確認してください。",
    colMenuItem: "メニュー",
    colPossibleCautions: "注意点",
    colRisk: "リスク",
    colAskVendor: "店員に聞く",
    colAction: "操作",
    review: "詳細",
    askOnly: "確認のみ",
    chooseProtein: "{safe} を選んでください。{avoid} は避けてください。",
    allProteinsConflict: "表示されているたんぱく源 ({avoid}) はすべてプロフィールと合いません — メニューにない選択肢を尋ねてみてください。",
    ocrFooterNote: "メニューOCRでは材料や交差接触を保証できません。この表を使って良い質問をし、店員に必ず確認してください。",
    menuScannerEyebrow: "メニュースキャナー",
    menuScannerTitle: "タイ料理メニューをスキャンして、上手に質問しましょう。",
    menuScannerSub: "あなたのプロフィールが自動で適用されます。リスクを推定し、店員への確認をお手伝いします。",
    uploadMenuPhoto: "メニュー写真をアップロード",
    uploadDescription: "メニュー看板の写真を選んでください。注意点一覧に変換します。",
    uploadMenu: "メニューをアップロード",
    removeImage: "写真を削除",
    scanMenu: "メニューをスキャン",
    scanning: "スキャン中…",
    useSampleMenu: "サンプルメニューを使う",
    searchPlaceholder: "メニューのヒント (例: カレー、チャーハン)",
    noMenuDetected: "メニュー項目が見つかりません。看板をはっきりと撮り直してください。",
    scanFailed: "スキャンに失敗しました",
    cannotReachService: "スキャンサービスに接続できません。",
    pleaseChooseImage: "画像ファイルを選んでください (JPG、PNG、HEIC)。",
    couldNotReadImage: "この画像を読み取れませんでした。別の画像を試してください。",
    tryAgain: "もう一度お試しください。",
    demoOcr: "デモOCR",
    modeMenu: "メニュー",
    modeVoice: "音声",
    modeType: "入力",
    apiProfileEyebrow: "あなたのプロフィール",
    foodNeedsApplied: "食事制限を適用済み",
    profileLoading: "読み込み中",
    profileApi: "API",
    profileLocal: "ローカル",
    profileFallback: "フォールバック",
    profileDemo: "デモ",
    allergensHeader: "アレルギー",
    dietsHeader: "食事制限",
    noProfileSelected: "アレルギーや食事制限がまだ選択されていません。",
    backToCheckAnother: "他のメニューを確認する",
    showThisToVendor: "店員に見せてください",
    romanizedMeaning: "ローマ字の意味",
    playAudio: "丁寧なタイ語を再生",
    yourProfileTitle: "このフレーズで確認する内容",
    askThenDecide: "聞いてから決める",
    crossContactNote: "一般的なレシピから材料を推定しています。屋台はお店ごとにレシピが違い、すり鉢、中華鍋、油、スプーン、まな板を介して交差接触が起こることがあります。",
    offlinePopularDishes: "人気メニュー (オフライン)",
    confirmWithVendor: "必ず店員に確認してください。",
    possibleMatch: "あなたのプロフィールに該当する可能性",
    noOfflineCommonIngredients: "オフラインデータには主要なアレルゲン/隠れ材料の情報がありません。",
    openPhraseCard: "タイ語フレーズカードを開く",
    playThaiAudio: "タイ語音声を再生",
    showVendor: "店員に見せる",
    tapToFlip: "タップして質問を切り替え",
    lowerRisk: "低リスク",
    phrasePreview: "フレーズプレビュー",
    vendorContains: "入っている",
    vendorNo: "入っていない",
    vendorNotSure: "わからない",
  },
  CN: {
    intro: "吃之前我们一起确认。",
    disclaimer: "这不是医疗建议。请务必向摊主确认。",
    riskEstimate: "风险估计",
    confidence: "可信度",
    commonlyContains: "通常含有",
    hiddenAsks: "需要询问的隐藏成分",
    crossContact: "需要确认的交叉接触",
    safer: "更低风险选择",
    phrase: "泰语短语卡",
    vendor: "摊主回复模式",
    cautionTable: "注意事项",
    menuScanResults: "菜单扫描结果",
    sortedByRisk: "已按你的档案风险排序。点单前请把每行的泰语句子给摊主确认。",
    colMenuItem: "菜品",
    colPossibleCautions: "可能注意事项",
    colRisk: "风险",
    colAskVendor: "问摊主",
    colAction: "操作",
    review: "详情",
    askOnly: "仅询问",
    chooseProtein: "选择 {safe}。避免 {avoid}。",
    allProteinsConflict: "列出的蛋白质 ({avoid}) 都与你的档案冲突 — 请询问菜单外的选择。",
    ocrFooterNote: "菜单 OCR 无法证实成分或交叉接触。请用此表提出更好的问题,然后向摊主确认。",
    menuScannerEyebrow: "菜单扫描",
    menuScannerTitle: "扫描泰国菜单,问出关键问题。",
    menuScannerSub: "系统会自动应用你的档案,估算风险并帮你向摊主确认。",
    uploadMenuPhoto: "上传菜单照片",
    uploadDescription: "选择菜单板照片,我们会转换为可用的注意事项表。",
    uploadMenu: "上传菜单",
    removeImage: "删除照片",
    scanMenu: "扫描菜单",
    scanning: "扫描中…",
    useSampleMenu: "使用示例菜单",
    searchPlaceholder: "可选菜单提示,例如咖喱、炒饭",
    noMenuDetected: "未检测到菜单项。请把菜单板拍得更清晰一些。",
    scanFailed: "扫描失败",
    cannotReachService: "无法连接扫描服务。",
    pleaseChooseImage: "请选择图片文件 (JPG、PNG、HEIC)。",
    couldNotReadImage: "无法读取此图片,请换一张。",
    tryAgain: "请重试。",
    demoOcr: "演示 OCR",
    modeMenu: "菜单",
    modeVoice: "语音",
    modeType: "输入",
    apiProfileEyebrow: "你的档案",
    foodNeedsApplied: "饮食需求已应用",
    profileLoading: "加载中",
    profileApi: "API",
    profileLocal: "本地",
    profileFallback: "备用",
    profileDemo: "演示",
    allergensHeader: "过敏原",
    dietsHeader: "饮食限制",
    noProfileSelected: "尚未选择过敏原或饮食限制。",
    backToCheckAnother: "返回查看其他菜",
    showThisToVendor: "请给摊主看",
    romanizedMeaning: "罗马音意思",
    playAudio: "播放礼貌泰语",
    yourProfileTitle: "此句检查的内容",
    askThenDecide: "先问,再决定",
    crossContactNote: "我们根据常见食谱估算可能成分。街头小吃每家做法不同,可能通过研钵、炒锅、油、勺子、砧板发生交叉接触。",
    offlinePopularDishes: "离线热门菜",
    confirmWithVendor: "请务必向摊主确认。",
    possibleMatch: "可能与你的档案匹配",
    noOfflineCommonIngredients: "离线菜品数据中没有主要过敏原或隐藏成分。",
    openPhraseCard: "打开泰语短语卡",
    playThaiAudio: "播放泰语音频",
    showVendor: "给摊主看",
    tapToFlip: "点击切换问题",
    lowerRisk: "低风险",
    phrasePreview: "短语预览",
    vendorContains: "有",
    vendorNo: "没有",
    vendorNotSure: "不确定",
  },
  KR: {
    intro: "먹기 전에 함께 확인해요.",
    disclaimer: "의학적 조언이 아닙니다. 반드시 판매자에게 확인하세요.",
    riskEstimate: "위험 추정",
    confidence: "신뢰도",
    commonlyContains: "일반적으로 포함",
    hiddenAsks: "확인할 숨은 재료",
    crossContact: "교차 접촉 확인",
    safer: "더 낮은 위험 선택",
    phrase: "태국어 문장 카드",
    vendor: "판매자 답변 모드",
  },
  AR: {
    intro: "دعنا نتحقق معا قبل أن تأكل.",
    disclaimer: "هذه ليست نصيحة طبية. يرجى التأكد دائما من البائع.",
    riskEstimate: "تقدير المخاطر",
    confidence: "مستوى الثقة",
    commonlyContains: "يحتوي عادة على",
    hiddenAsks: "مكونات خفية يجب السؤال عنها",
    crossContact: "تأكد من التلامس المتبادل",
    safer: "بدائل أقل خطورة",
    phrase: "بطاقة عبارة تايلندية",
    vendor: "وضع رد البائع",
  },
} as const;

type CopyKey = keyof typeof copy.EN;

function tx(lang: Lang, key: CopyKey): string {
  const langDict = copy[lang] as Partial<Record<CopyKey, string>>;
  return langDict?.[key] ?? copy.EN[key] ?? String(key);
}

// Multi-lang allergen / diet labels. KR/AR fall back to EN if not provided.
const allergenLabels: Record<Allergen, { icon: string; labels: Partial<Record<Lang, string>> }> = {
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

const dietLabels: Record<Diet, { icon: string; labels: Partial<Record<Lang, string>> }> = {
  vegan:       { icon: "🌱", labels: { EN: "Vegan",       TH: "วีแกน",       JP: "ヴィーガン",        CN: "纯素" } },
  vegetarian:  { icon: "🥬", labels: { EN: "Vegetarian",  TH: "มังสวิรัติ",   JP: "ベジタリアン",      CN: "素食" } },
  halal:       { icon: "🌙", labels: { EN: "Halal",       TH: "ฮาลาล",       JP: "ハラール",          CN: "清真" } },
  glutenFree:  { icon: "🌾", labels: { EN: "Gluten-free", TH: "ไม่มีกลูเตน",   JP: "グルテンフリー",    CN: "无麸质" } },
};

function allergenLabel(allergen: Allergen, lang: Lang): string {
  return allergenLabels[allergen].labels[lang] ?? allergenLabels[allergen].labels.EN ?? allergen;
}
function dietLabel(diet: Diet, lang: Lang): string {
  return dietLabels[diet].labels[lang] ?? dietLabels[diet].labels.EN ?? diet;
}

const ingredientBank = {
  fishSauce: {
    key: "fishSauce",
    label: "Fish sauce",
    icon: "🐟",
    flags: ["fish", "vegan", "vegetarian", "halal"] as Array<Allergen | Diet>,
  },
  shrimpPaste: {
    key: "shrimpPaste",
    label: "Shrimp paste",
    icon: "🦐",
    flags: ["shellfish", "vegan", "vegetarian", "halal"] as Array<Allergen | Diet>,
  },
  peanuts: {
    key: "peanuts",
    label: "Peanuts",
    icon: "🥜",
    flags: ["peanut"] as Array<Allergen | Diet>,
  },
  egg: {
    key: "egg",
    label: "Egg",
    icon: "🥚",
    flags: ["egg", "vegan"] as Array<Allergen | Diet>,
  },
  oysterSauce: {
    key: "oysterSauce",
    label: "Oyster sauce",
    icon: "🦪",
    flags: ["shellfish", "vegan", "vegetarian", "halal"] as Array<Allergen | Diet>,
  },
  driedShrimp: {
    key: "driedShrimp",
    label: "Dried shrimp",
    icon: "🦐",
    flags: ["shellfish", "vegan", "vegetarian", "halal"] as Array<Allergen | Diet>,
  },
  boneBroth: {
    key: "boneBroth",
    label: "Bone broth",
    icon: "🍖",
    flags: ["vegan", "vegetarian", "halal"] as Array<Allergen | Diet>,
  },
  soySauce: {
    key: "soySauce",
    label: "Soy sauce",
    icon: "🫘",
    flags: ["soy", "glutenFree", "gluten"] as Array<Allergen | Diet>,
  },
  wheatNoodles: {
    key: "wheatNoodles",
    label: "Wheat noodles",
    icon: "🍜",
    flags: ["gluten", "glutenFree"] as Array<Allergen | Diet>,
  },
  pork: {
    key: "pork",
    label: "Pork",
    icon: "🥩",
    flags: ["vegan", "vegetarian", "halal"] as Array<Allergen | Diet>,
  },
  coconutMilk: {
    key: "coconutMilk",
    label: "Coconut milk",
    icon: "🥥",
    flags: [] as Array<Allergen | Diet>,
  },
  sesameSeeds: {
    key: "sesameSeeds",
    label: "Sesame seeds",
    icon: "⚪",
    flags: ["sesame"] as Array<Allergen | Diet>,
  },
};

const sampleMenuRows: MenuCautionRow[] = [
  {
    id: "jungle-curry",
    thai: "แกงป่า",
    english: "Jungle curry",
    price: "100 THB",
    confidence: "Medium",
    likelyContains: [ingredientBank.fishSauce, ingredientBank.shrimpPaste, ingredientBank.pork],
    cautionNotes: ["Curry paste may include shrimp paste", "Protein options may include pork", "Usually not vegan"],
    askVendor: "Ask about fish sauce, shrimp paste, and pork stock.",
  },
  {
    id: "red-curry-stir-fry",
    thai: "ผัดพริกแกง",
    english: "Red curry stir-fry",
    price: "100 THB",
    confidence: "Medium",
    likelyContains: [ingredientBank.fishSauce, ingredientBank.shrimpPaste, ingredientBank.oysterSauce],
    cautionNotes: ["Curry paste may contain shrimp paste", "Often cooked in shared wok"],
    askVendor: "Ask if curry paste has shrimp paste or fish sauce.",
    matchedDishId: "pad-krapow",
  },
  {
    id: "oyster-sauce-stir-fry",
    thai: "ผัดน้ำมันหอย",
    english: "Oyster sauce stir-fry",
    price: "100 THB",
    confidence: "High",
    likelyContains: [ingredientBank.oysterSauce, ingredientBank.fishSauce, ingredientBank.soySauce],
    cautionNotes: ["Name suggests oyster sauce", "Shared wok risk"],
    askVendor: "Ask if it can be made without oyster sauce or fish sauce.",
  },
  {
    id: "fried-rice",
    thai: "ข้าวผัด",
    english: "Fried rice",
    price: "50-150 THB",
    confidence: "Medium",
    likelyContains: [ingredientBank.egg, ingredientBank.fishSauce, ingredientBank.soySauce],
    cautionNotes: ["Often has egg", "May use fish sauce", "Shared wok with seafood"],
    askVendor: "Ask for no egg, no fish sauce, and a clean wok if needed.",
    matchedDishId: "vegetable-fried-rice",
  },
  {
    id: "offal-soup",
    thai: "ต้มเครื่องในเนื้อ",
    english: "Beef offal soup",
    price: "100 THB",
    confidence: "Medium",
    likelyContains: [ingredientBank.boneBroth, ingredientBank.fishSauce],
    cautionNotes: ["Animal broth", "May use fish sauce", "Halal status must be confirmed"],
    askVendor: "Ask about broth base and halal handling.",
  },
  {
    id: "tofu-bean-sprout",
    thai: "ผัดถั่วงอกเต้าหู้",
    english: "Bean sprout tofu stir-fry",
    price: "80 THB",
    confidence: "Medium",
    likelyContains: [ingredientBank.soySauce, ingredientBank.oysterSauce],
    cautionNotes: ["Tofu contains soy", "May still use oyster sauce", "Shared wok risk"],
    askVendor: "Ask if it can be made with soy sauce only, no oyster sauce.",
  },
  {
    id: "thai-omelette",
    thai: "ไข่เจียวทรงเครื่อง",
    english: "Thai omelette",
    price: "70 THB",
    confidence: "High",
    likelyContains: [ingredientBank.egg, ingredientBank.fishSauce],
    cautionNotes: ["Egg-based dish", "May use fish sauce", "Shared frying oil"],
    askVendor: "Ask about fish sauce and shared oil.",
  },
  {
    id: "bitter-melon-egg",
    thai: "มะระผัดไข่",
    english: "Bitter melon with egg",
    price: "100 THB",
    confidence: "High",
    likelyContains: [ingredientBank.egg, ingredientBank.fishSauce, ingredientBank.soySauce],
    cautionNotes: ["Name includes egg", "May use fish sauce or soy sauce"],
    askVendor: "Ask if it can be made without egg and fish sauce.",
  },
];

type IngredientKey = keyof typeof ingredientBank;

type ServerMenuRow = {
  thai: string;
  english: string;
  price?: string;
  confidence: Confidence;
  likelyContains: string[];
  cautionNotes: string[];
  askVendor: string;
};

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "item"
  );
}

function mapServerRow(row: ServerMenuRow, index: number): MenuCautionRow | null {
  if (!row?.thai && !row?.english) return null;
  const ingredients = (row.likelyContains ?? [])
    .filter((key): key is IngredientKey => key in ingredientBank)
    .map((key) => ingredientBank[key]);

  // Backend prepends "Protein options: beef / pork / chicken / fish" as the first
  // caution note. Pull it back into a structured field so we can apply per-protein logic.
  const rawNotes = Array.isArray(row.cautionNotes) ? row.cautionNotes : [];
  let proteinOptions: string[] | undefined;
  const cautionNotes: string[] = [];
  for (const note of rawNotes) {
    const match = /^Protein options:\s*(.+)$/i.exec(note.trim());
    if (match && !proteinOptions) {
      proteinOptions = match[1]
        .split(/\s*\/\s*/)
        .map((p) => p.trim().toLowerCase())
        .filter(Boolean);
      continue;
    }
    cautionNotes.push(note);
  }

  return {
    id: `scan-${index}-${slugify(row.english || row.thai)}`,
    thai: row.thai || row.english,
    english: row.english || row.thai,
    price: row.price?.trim() || "—",
    confidence: row.confidence,
    likelyContains: ingredients,
    cautionNotes,
    askVendor: row.askVendor || "",
    proteinOptions,
  };
}

const dishes: Dish[] = [
  {
    id: "pad-thai",
    thai: "ผัดไทย",
    english: "Pad Thai",
    romanized: "phat thai",
    category: "stir-fried noodles",
    baseRisk: "Medium",
    confidence: "High",
    commonlyContains: [
      ingredientBank.fishSauce,
      ingredientBank.peanuts,
      ingredientBank.egg,
      ingredientBank.driedShrimp,
    ],
    hiddenAsks: ["fish sauce in the sauce", "dried shrimp in garnish", "peanut topping", "egg mixed into noodles"],
    crossContact: ["shared wok", "shared noodle tongs", "peanut garnish station"],
    saferAlternativeIds: ["mango-sticky-rice", "vegetable-fried-rice", "fresh-spring-rolls"],
  },
  {
    id: "som-tum",
    thai: "ส้มตำ",
    english: "Som Tum",
    romanized: "som tam",
    category: "green papaya salad",
    baseRisk: "High",
    confidence: "High",
    commonlyContains: [
      ingredientBank.fishSauce,
      ingredientBank.shrimpPaste,
      ingredientBank.peanuts,
      ingredientBank.driedShrimp,
    ],
    hiddenAsks: ["fermented fish sauce", "shrimp paste", "dried shrimp", "peanuts crushed in the mortar"],
    crossContact: ["shared mortar", "shared pestle", "shared spoon for fish sauce"],
    saferAlternativeIds: ["mango-sticky-rice", "coconut-ice-cream", "vegetable-fried-rice"],
  },
  {
    id: "tom-yum",
    thai: "ต้มยำกุ้ง",
    english: "Tom Yum Goong",
    romanized: "tom yum goong",
    category: "spicy sour soup",
    baseRisk: "High",
    confidence: "High",
    commonlyContains: [
      ingredientBank.fishSauce,
      ingredientBank.shrimpPaste,
      ingredientBank.driedShrimp,
    ],
    hiddenAsks: ["shrimp stock", "fish sauce", "chili paste with shrimp", "shared soup ladle"],
    crossContact: ["shared soup pot", "shared ladle", "seafood prep board"],
    saferAlternativeIds: ["tom-kha-hed", "vegetable-fried-rice", "mango-sticky-rice"],
  },
  {
    id: "pad-krapow",
    thai: "ผัดกะเพรา",
    english: "Pad Krapow",
    romanized: "phat kaphrao",
    category: "holy basil stir-fry",
    baseRisk: "Medium",
    confidence: "Medium",
    commonlyContains: [
      ingredientBank.oysterSauce,
      ingredientBank.fishSauce,
      ingredientBank.soySauce,
      ingredientBank.egg,
    ],
    hiddenAsks: ["oyster sauce", "fish sauce", "fried egg topping", "wok used for seafood"],
    crossContact: ["shared wok", "shared spatula", "same oil for fried egg"],
    saferAlternativeIds: ["vegetable-fried-rice", "tom-kha-hed", "fresh-spring-rolls"],
  },
  {
    id: "khao-soi",
    thai: "ข้าวซอย",
    english: "Khao Soi",
    romanized: "khao soi",
    category: "northern curry noodles",
    baseRisk: "Medium",
    confidence: "Medium",
    commonlyContains: [
      ingredientBank.coconutMilk,
      ingredientBank.fishSauce,
      ingredientBank.wheatNoodles,
      ingredientBank.boneBroth,
    ],
    hiddenAsks: ["wheat egg noodles", "chicken or beef stock", "fish sauce", "shrimp paste in curry paste"],
    crossContact: ["shared noodle basket", "shared curry pot", "shared topping spoon"],
    saferAlternativeIds: ["tom-kha-hed", "mango-sticky-rice", "coconut-ice-cream"],
  },
  {
    id: "massaman",
    thai: "แกงมัสมั่น",
    english: "Massaman Curry",
    romanized: "gaeng matsaman",
    category: "mild curry",
    baseRisk: "Medium",
    confidence: "Medium",
    commonlyContains: [
      ingredientBank.peanuts,
      ingredientBank.fishSauce,
      ingredientBank.coconutMilk,
    ],
    hiddenAsks: ["peanuts in curry", "fish sauce", "meat stock", "shared curry ladle"],
    crossContact: ["shared curry pot", "shared ladle", "peanut garnish station"],
    saferAlternativeIds: ["tom-kha-hed", "vegetable-fried-rice", "mango-sticky-rice"],
  },
  {
    id: "boat-noodle",
    thai: "ก๋วยเตี๋ยวเรือ",
    english: "Boat Noodle",
    romanized: "kuai tiao ruea",
    category: "rich noodle soup",
    baseRisk: "High",
    confidence: "Medium",
    commonlyContains: [
      ingredientBank.boneBroth,
      ingredientBank.fishSauce,
      ingredientBank.soySauce,
      ingredientBank.wheatNoodles,
    ],
    hiddenAsks: ["pork or beef blood", "bone broth", "fish sauce", "wheat noodles"],
    crossContact: ["shared noodle basket", "shared soup pot", "shared ladle"],
    saferAlternativeIds: ["tom-kha-hed", "fresh-spring-rolls", "mango-sticky-rice"],
  },
  {
    id: "mango-sticky-rice",
    thai: "ข้าวเหนียวมะม่วง",
    english: "Mango Sticky Rice",
    romanized: "khao niao mamuang",
    category: "dessert",
    baseRisk: "Low",
    confidence: "High",
    commonlyContains: [ingredientBank.coconutMilk, ingredientBank.sesameSeeds],
    hiddenAsks: ["sesame garnish", "milk powder in coconut sauce", "shared dessert spoon"],
    crossContact: ["shared dessert tray", "shared serving spoon"],
    saferAlternativeIds: ["coconut-ice-cream", "fresh-fruit", "tom-kha-hed"],
  },
  {
    id: "tom-kha-hed",
    thai: "ต้มข่าเห็ด",
    english: "Tom Kha Hed",
    romanized: "tom kha het",
    category: "coconut mushroom soup",
    baseRisk: "Low",
    confidence: "Medium",
    commonlyContains: [ingredientBank.coconutMilk, ingredientBank.fishSauce],
    hiddenAsks: ["fish sauce", "chicken stock", "shrimp paste in chili paste"],
    crossContact: ["shared soup pot", "shared ladle"],
    saferAlternativeIds: ["mango-sticky-rice", "vegetable-fried-rice", "fresh-fruit"],
  },
  {
    id: "vegetable-fried-rice",
    thai: "ข้าวผัดผัก",
    english: "Vegetable Fried Rice",
    romanized: "khao phat phak",
    category: "fried rice",
    baseRisk: "Medium",
    confidence: "Medium",
    commonlyContains: [ingredientBank.egg, ingredientBank.fishSauce, ingredientBank.soySauce],
    hiddenAsks: ["egg", "fish sauce", "oyster sauce", "shared wok"],
    crossContact: ["shared wok", "shared spatula", "same oil as seafood"],
    saferAlternativeIds: ["tom-kha-hed", "mango-sticky-rice", "fresh-fruit"],
  },
  {
    id: "fresh-spring-rolls",
    thai: "ปอเปี๊ยะสด",
    english: "Fresh Spring Rolls",
    romanized: "popiah sot",
    category: "fresh rolls",
    baseRisk: "Medium",
    confidence: "Medium",
    commonlyContains: [ingredientBank.soySauce, ingredientBank.peanuts, ingredientBank.driedShrimp],
    hiddenAsks: ["peanut sauce", "dried shrimp", "fish sauce in dipping sauce"],
    crossContact: ["shared prep board", "shared dipping sauce spoon"],
    saferAlternativeIds: ["mango-sticky-rice", "fresh-fruit", "coconut-ice-cream"],
  },
  {
    id: "coconut-ice-cream",
    thai: "ไอศกรีมกะทิ",
    english: "Coconut Ice Cream",
    romanized: "ai sa krim kathi",
    category: "dessert",
    baseRisk: "Low",
    confidence: "Medium",
    commonlyContains: [ingredientBank.coconutMilk, ingredientBank.peanuts],
    hiddenAsks: ["peanut topping", "milk in ice cream mix", "shared scoop"],
    crossContact: ["shared scoop", "topping station"],
    saferAlternativeIds: ["fresh-fruit", "mango-sticky-rice", "tom-kha-hed"],
  },
  {
    id: "fresh-fruit",
    thai: "ผลไม้สด",
    english: "Fresh Fruit",
    romanized: "phonlamai sot",
    category: "fruit",
    baseRisk: "Low",
    confidence: "High",
    commonlyContains: [],
    hiddenAsks: ["shared knife", "condiment dip with shrimp paste", "same board as other food"],
    crossContact: ["shared knife", "shared cutting board"],
    saferAlternativeIds: ["mango-sticky-rice", "coconut-ice-cream", "tom-kha-hed"],
  },
];

const defaultProfile: Profile = {
  allergens: ["peanut", "shellfish"],
  diets: [],
  highContrast: false,
  language: "EN",
};

const riskStyles: Record<Risk, string> = {
  Low: "bg-risk-low text-white",
  Medium: "bg-risk-medium text-[#27160a]",
  High: "bg-risk-high text-white",
  Unknown: "bg-risk-unknown text-white",
};

const riskIcon: Record<Risk, string> = {
  Low: "🟢",
  Medium: "🟡",
  High: "🔴",
  Unknown: "⚪",
};

function findDish(query: string) {
  const clean = query.trim().toLowerCase();
  return (
    dishes.find((dish) =>
      [dish.english, dish.thai, dish.romanized, dish.category]
        .join(" ")
        .toLowerCase()
        .includes(clean),
    ) ?? dishes[0]
  );
}

// Strict variant: returns undefined when nothing matches (no Pad Thai fallback).
// Used by the scan-row enricher so an unmatched scanned dish doesn't masquerade
// as a known canonical dish. Matches in either direction so a noisy scanned
// query like "Holy Basil Stir-fry (beef/pork) ผัดกะเพรา" still finds pad-krapow.
function findDishStrict(query: string): Dish | undefined {
  const q = query.trim().toLowerCase();
  if (q.length < 3) return undefined;
  for (const dish of dishes) {
    const fields = [dish.id, dish.english, dish.thai, dish.romanized]
      .map((f) => f.toLowerCase())
      .filter((f) => f.length >= 3);
    // Forward: scanned query embeds a canonical field (e.g. query has "ผัดกะเพรา")
    if (fields.some((f) => q.includes(f))) return dish;
    // Reverse: a canonical field embeds the scanned query (rare but possible)
    if (fields.some((f) => f.includes(q))) return dish;
  }
  return undefined;
}

function scoreDish(dish: Dish, profile: Profile): AnalysisResult {
  const sensitivities = [...profile.allergens, ...profile.diets];
  const matched = dish.commonlyContains.flatMap((ingredient) =>
    ingredient.flags.filter((flag) => sensitivities.includes(flag as never)).map((flag) => ({
      flag,
      ingredient: ingredient.label,
    })),
  );
  const hiddenDietRisk = profile.diets.some((diet) =>
    ["vegan", "vegetarian", "halal", "glutenFree"].includes(diet),
  );

  let risk: Risk = dish.baseRisk;
  if (matched.length >= 2 || matched.some((item) => ["peanut", "shellfish", "fish"].includes(String(item.flag)))) {
    risk = "High";
  } else if (matched.length === 1 || hiddenDietRisk) {
    risk = dish.baseRisk === "Low" ? "Medium" : dish.baseRisk;
  }

  const riskReasons = matched.length
    ? Array.from(new Set(matched.map((item) => `${item.ingredient} may conflict with ${labelForFlag(String(item.flag))}`)))
    : ["No direct profile match found in the common ingredient list. Please still confirm with the vendor."];

  return {
    dish,
    risk,
    riskReasons,
    confidence: dish.confidence,
  };
}

// Severe allergens that make any single direct match auto-High.
// Other allergens (soy, sesame, milk, gluten) are treated as Medium when isolated.
const SEVERE_ALLERGENS: Allergen[] = ["peanut", "shellfish", "fish", "treeNuts"];

// Per-lang glue text inside "{ingredient} may conflict with {flag}" reasons,
// plus the fallback when no profile match exists.
const REASON_TEMPLATES: Record<Lang, { conflict: (ing: string, flag: string) => string; fallback: string }> = {
  EN: { conflict: (i, f) => `${i} may conflict with ${f}`, fallback: "Recipe varies by vendor. Use this as a question list, not a safety guarantee." },
  TH: { conflict: (i, f) => `${i} อาจขัดกับ ${f}`,           fallback: "สูตรขึ้นกับร้าน ใช้เป็นรายการคำถาม ไม่ใช่การยืนยันความปลอดภัย" },
  JP: { conflict: (i, f) => `${i} は ${f} と競合する可能性があります`, fallback: "レシピは店ごとに異なります。質問リストとして使い、安全保証ではありません。" },
  CN: { conflict: (i, f) => `${i} 可能与 ${f} 冲突`,         fallback: "配方因店而异。请将此作为问题清单使用,不能保证安全。" },
  KR: { conflict: (i, f) => `${i} 이(가) ${f} 와 충돌할 수 있습니다`, fallback: "레시피는 가게마다 다릅니다. 안전 보장이 아닌 질문 목록으로 사용하세요." },
  AR: { conflict: (i, f) => `${i} قد يتعارض مع ${f}`,        fallback: "تختلف الوصفة حسب البائع. استخدمها كقائمة أسئلة وليس ضماناً للسلامة." },
};

function scoreMenuRow(row: MenuCautionRow, profile: Profile, lang: Lang = "EN") {
  const allergenSet = new Set<Allergen>(profile.allergens);
  const dietSet = new Set<Diet>(profile.diets);

  const allergenMatches: { flag: Allergen; ingredient: string }[] = [];
  const dietMatches: { flag: Diet; ingredient: string }[] = [];

  for (const ingredient of row.likelyContains) {
    for (const flag of ingredient.flags) {
      if (allergenSet.has(flag as Allergen)) {
        allergenMatches.push({ flag: flag as Allergen, ingredient: ingredient.label });
      } else if (dietSet.has(flag as Diet)) {
        dietMatches.push({ flag: flag as Diet, ingredient: ingredient.label });
      }
    }
  }

  const hasSevere = allergenMatches.some((m) => SEVERE_ALLERGENS.includes(m.flag));
  let risk: Risk;
  if (hasSevere || allergenMatches.length >= 2) {
    risk = "High";
  } else if (allergenMatches.length === 1) {
    // single mild allergen (e.g. soy alone)
    risk = "Medium";
  } else if (dietMatches.length > 0) {
    // diet conflict only — important but not life-threatening
    risk = "Medium";
  } else if (row.cautionNotes.length) {
    risk = "Medium";
  } else {
    risk = "Low";
  }

  const tpl = REASON_TEMPLATES[lang] ?? REASON_TEMPLATES.EN;
  const reasons = [
    ...allergenMatches.map((m) => tpl.conflict(m.ingredient, labelForFlag(m.flag, lang))),
    ...dietMatches.map((m) => tpl.conflict(m.ingredient, labelForFlag(m.flag, lang))),
  ];
  const dedupedReasons = Array.from(new Set(reasons));

  return {
    risk,
    reasons: dedupedReasons.length ? dedupedReasons : [tpl.fallback],
    allergenMatches,
    dietMatches,
  };
}

function labelForFlag(flag: string, lang: Lang = "EN") {
  if (flag in allergenLabels) return allergenLabel(flag as Allergen, lang);
  if (flag in dietLabels) return dietLabel(flag as Diet, lang);
  return flag;
}

// English ingredient label → Thai. Used inside Thai phrase to localize ingredient
// names that come from the canonical ingredientBank (which is English-keyed).
const INGREDIENT_TH: Record<string, string> = {
  "Fish sauce": "น้ำปลา",
  "Shrimp paste": "กะปิ",
  Peanuts: "ถั่วลิสง",
  Egg: "ไข่",
  "Oyster sauce": "น้ำมันหอย",
  "Dried shrimp": "กุ้งแห้ง",
  "Bone broth": "น้ำซุปกระดูก",
  "Soy sauce": "ซีอิ๊ว",
  "Wheat noodles": "เส้นที่มีแป้งสาลี",
  "Coconut milk": "กะทิ",
  "Sesame seeds": "งา",
  Pork: "หมู",
};

function buildThaiPhrase(profile: Profile, dish: Dish) {
  // Thai phrase is for the Thai vendor — always in Thai regardless of user language.
  const allergyLines = profile.allergens.map((a) => `• ${allergenLabel(a, "TH")}`);
  const dietText = profile.diets.map((d) => dietLabel(d, "TH")).join(" / ");

  const riskyIngredients = Array.from(
    new Set(
      dish.commonlyContains
        .filter((ingredient) =>
          ingredient.flags.some((flag) => [...profile.allergens, ...profile.diets].includes(flag as never)),
        )
        .map((ingredient) => INGREDIENT_TH[ingredient.label] ?? ingredient.label),
    ),
  );

  const lines: string[] = ["สวัสดีค่ะ 🙏"];

  if (allergyLines.length) {
    lines.push("", "ฉันแพ้:", ...allergyLines);
  }
  if (dietText) {
    lines.push("", `ฉันทาน: ${dietText}`);
  }
  if (!allergyLines.length && !dietText) {
    lines.push("", "ฉันมีข้อจำกัดเรื่องอาหาร");
  }

  lines.push("", `เมนู ${dish.thai} มีส่วนผสมเหล่านี้ไหมคะ?`);
  if (riskyIngredients.length) {
    for (const ing of riskyIngredients) lines.push(`• ${ing}`);
  } else {
    lines.push("(ส่วนผสมที่ควรระวัง)");
  }

  lines.push("", "และใช้อุปกรณ์/กระทะ/น้ำมันร่วมกับเมนูที่มีส่วนผสมเหล่านี้ไหมคะ?");

  return lines.join("\n");
}

// Per-language labels for the structured romanized phrase. Mirrors the bulleted
// Thai phrase so the user can verify what they're handing the vendor.
const PHRASE_LABELS: Record<Lang, {
  hello: string;
  imAllergic: string;
  iFollow: string;
  noRestrictions: string;
  ingredientAsk: (dish: string) => string;
  noSpecific: string;
  crossContact: string;
}> = {
  EN: {
    hello: "Hello 🙏",
    imAllergic: "I'm allergic to:",
    iFollow: "I follow:",
    noRestrictions: "I have dietary restrictions.",
    ingredientAsk: (d) => `Does ${d} contain any of these?`,
    noSpecific: "(any risky ingredients)",
    crossContact: "And is it cooked with shared tools, woks, or oil with dishes that contain them?",
  },
  TH: {
    hello: "สวัสดีค่ะ 🙏",
    imAllergic: "ฉันแพ้:",
    iFollow: "ฉันทาน:",
    noRestrictions: "ฉันมีข้อจำกัดเรื่องอาหาร",
    ingredientAsk: (d) => `เมนู ${d} มีส่วนผสมเหล่านี้ไหมคะ?`,
    noSpecific: "(ส่วนผสมที่ควรระวัง)",
    crossContact: "และใช้อุปกรณ์/กระทะ/น้ำมันร่วมกับเมนูที่มีส่วนผสมเหล่านี้ไหมคะ?",
  },
  JP: {
    hello: "こんにちは 🙏",
    imAllergic: "私は次のものにアレルギーがあります:",
    iFollow: "食事制限:",
    noRestrictions: "私には食事制限があります。",
    ingredientAsk: (d) => `${d} には次のものが含まれていますか?`,
    noSpecific: "(注意すべき材料)",
    crossContact: "また、これらの材料を含む料理と調理器具・鍋・油を共有していますか?",
  },
  CN: {
    hello: "你好 🙏",
    imAllergic: "我对以下食物过敏:",
    iFollow: "我的饮食限制:",
    noRestrictions: "我有饮食限制。",
    ingredientAsk: (d) => `${d} 里含有以下成分吗?`,
    noSpecific: "(需要注意的成分)",
    crossContact: "与含这些成分的菜共用厨具、锅或油吗?",
  },
  KR: {
    hello: "안녕하세요 🙏",
    imAllergic: "저는 다음에 알레르기가 있습니다:",
    iFollow: "식이 제한:",
    noRestrictions: "저는 식이 제한이 있습니다.",
    ingredientAsk: (d) => `${d}에 다음 성분이 들어 있나요?`,
    noSpecific: "(주의할 성분)",
    crossContact: "이 성분이 들어간 요리와 도구나 기름을 공유하나요?",
  },
  AR: {
    hello: "مرحباً 🙏",
    imAllergic: "أعاني من حساسية تجاه:",
    iFollow: "أتبع نظام:",
    noRestrictions: "لدي قيود غذائية.",
    ingredientAsk: (d) => `هل يحتوي ${d} على أيٍّ من هذه؟`,
    noSpecific: "(مكونات يجب الحذر منها)",
    crossContact: "وهل يُطهى بأدوات أو مقالٍ أو زيتٍ مشترك مع أطباق تحتوي عليها؟",
  },
};

function romanizePhrase(profile: Profile, dish: Dish, lang: Lang = "EN") {
  const labels = PHRASE_LABELS[lang] ?? PHRASE_LABELS.EN;
  const allergyLines = profile.allergens.map((a) => `• ${allergenLabel(a, lang)}`);
  const dietText = profile.diets.map((d) => dietLabel(d, lang)).join(" / ");
  const riskyIngredients = Array.from(
    new Set(
      dish.commonlyContains
        .filter((ingredient) =>
          ingredient.flags.some((flag) => [...profile.allergens, ...profile.diets].includes(flag as never)),
        )
        .map((ingredient) => ingredient.label),
    ),
  );

  const lines: string[] = [labels.hello];
  if (allergyLines.length) {
    lines.push("", labels.imAllergic, ...allergyLines);
  }
  if (dietText) {
    lines.push("", `${labels.iFollow} ${dietText}`);
  }
  if (!allergyLines.length && !dietText) {
    lines.push("", labels.noRestrictions);
  }
  lines.push("", labels.ingredientAsk(dish.english));
  if (riskyIngredients.length) {
    for (const ing of riskyIngredients) lines.push(`• ${ing}`);
  } else {
    lines.push(labels.noSpecific);
  }
  lines.push("", labels.crossContact);

  return lines.join("\n");
}

// Flags each protein choice (as written next to a Thai dish) raises against
// allergens/diets. Conservative: when in doubt, list it so we can warn the user.
const PROTEIN_FLAGS: Record<string, Array<Allergen | Diet>> = {
  pork:    ["halal", "vegan", "vegetarian"],
  shrimp:  ["shellfish", "vegan", "vegetarian"],
  fish:    ["fish", "vegan", "vegetarian"],
  squid:   ["shellfish", "vegan", "vegetarian"],
  beef:    ["vegan", "vegetarian"],
  chicken: ["vegan", "vegetarian"],
  egg:     ["egg", "vegan"],
  tofu:    ["soy"],
  offal:   ["halal", "vegan", "vegetarian"],
};

const PROTEIN_LABELS_I18N: Record<string, Partial<Record<Lang, string>>> = {
  pork:    { EN: "pork",    TH: "หมู",        JP: "豚肉",   CN: "猪肉" },
  shrimp:  { EN: "shrimp",  TH: "กุ้ง",        JP: "エビ",    CN: "虾" },
  fish:    { EN: "fish",    TH: "ปลา",        JP: "魚",     CN: "鱼" },
  squid:   { EN: "squid",   TH: "ปลาหมึก",    JP: "イカ",    CN: "鱿鱼" },
  beef:    { EN: "beef",    TH: "เนื้อ",       JP: "牛肉",   CN: "牛肉" },
  chicken: { EN: "chicken", TH: "ไก่",         JP: "鶏肉",   CN: "鸡肉" },
  egg:     { EN: "egg",     TH: "ไข่",         JP: "卵",     CN: "鸡蛋" },
  tofu:    { EN: "tofu",    TH: "เต้าหู้",      JP: "豆腐",   CN: "豆腐" },
  offal:   { EN: "offal",   TH: "เครื่องใน",    JP: "内臓",   CN: "内脏" },
};

function proteinLabel(key: string, lang: Lang): string {
  return PROTEIN_LABELS_I18N[key]?.[lang] ?? PROTEIN_LABELS_I18N[key]?.EN ?? key;
}

type ProteinHint = {
  safe: string[];
  avoid: string[];
  note: string;
};

// Localized "Choose X. Avoid Y." templates.
const CHOOSE_AVOID_TEMPLATES: Record<Lang, (safe: string, avoid: string) => string> = {
  EN: (s, a) => `Choose ${s}. Avoid ${a}.`,
  TH: (s, a) => `เลือก ${s} หลีกเลี่ยง ${a}`,
  JP: (s, a) => `${s} を選んでください。${a} は避けてください。`,
  CN: (s, a) => `选择 ${s}。避免 ${a}。`,
  KR: (s, a) => `${s} 을(를) 선택하세요. ${a} 은(는) 피하세요.`,
  AR: (s, a) => `اختر ${s}. تجنب ${a}.`,
};
const ALL_AVOID_TEMPLATES: Record<Lang, (avoid: string) => string> = {
  EN: (a) => `All listed proteins (${a}) conflict with your profile — ask for an off-menu option.`,
  TH: (a) => `เนื้อสัตว์ที่มีให้ (${a}) ขัดกับโปรไฟล์ทั้งหมด — ลองขอเมนูพิเศษนอกเมนู`,
  JP: (a) => `表示されているたんぱく源 (${a}) はすべてプロフィールと合いません — メニューにない選択肢を尋ねてみてください。`,
  CN: (a) => `列出的蛋白质 (${a}) 都与你的档案冲突 — 请询问菜单外的选择。`,
  KR: (a) => `표시된 단백질 (${a}) 모두 프로필과 맞지 않습니다 — 메뉴에 없는 옵션을 문의하세요.`,
  AR: (a) => `جميع البروتينات المعروضة (${a}) تتعارض مع ملفك — اطلب خياراً خارج القائمة.`,
};
const JOIN_OR: Record<Lang, string> = {
  EN: " or ", TH: " หรือ ", JP: " または ", CN: " 或 ", KR: " 또는 ", AR: " أو ",
};
const JOIN_AND: Record<Lang, string> = {
  EN: " & ", TH: " และ ", JP: " と ", CN: " 和 ", KR: " 그리고 ", AR: " و ",
};

function buildProteinHint(
  proteinOptions: string[] | undefined,
  profile: Profile,
  lang: Lang = "EN",
): ProteinHint | undefined {
  if (!proteinOptions?.length) return undefined;
  const sensitivities = new Set<string>([...profile.allergens, ...profile.diets]);
  const safe: string[] = [];
  const avoid: string[] = [];
  for (const raw of proteinOptions) {
    const key = raw.trim().toLowerCase();
    const label = proteinLabel(key, lang);
    const flags = PROTEIN_FLAGS[key] ?? [];
    if (flags.some((f) => sensitivities.has(f))) avoid.push(label);
    else safe.push(label);
  }
  if (!avoid.length) return undefined; // every option is fine — no need to clutter
  if (!safe.length) {
    return {
      safe,
      avoid,
      note: ALL_AVOID_TEMPLATES[lang](avoid.join(", ")),
    };
  }
  return {
    safe,
    avoid,
    note: CHOOSE_AVOID_TEMPLATES[lang](safe.join(JOIN_OR[lang]), avoid.join(JOIN_AND[lang])),
  };
}

// Wrap a scanned row in a Dish-shaped object so existing helpers (buildThaiPhrase,
// romanizePhrase) can operate on it without a special branch.
function syntheticDishFromRow(row: MenuCautionRow): Dish {
  return {
    id: row.id,
    thai: row.thai,
    english: row.english,
    romanized: "",
    category: "scanned menu item",
    baseRisk: "Medium",
    confidence: row.confidence,
    commonlyContains: row.likelyContains,
    hiddenAsks: row.cautionNotes,
    crossContact: [],
    saferAlternativeIds: [],
  };
}

type EnrichedScanRow = MenuCautionRow & {
  risk: Risk;
  uncertain: boolean;
  allergenMatches: { flag: Allergen; ingredient: string }[];
  dietMatches: { flag: Diet; ingredient: string }[];
  proteinHint?: ProteinHint;
  matchedDish?: Dish;
  askVendorTH: string;
  askVendorUserLang: string;
};

const RISK_ORDER: Record<Risk, number> = { High: 0, Medium: 1, Unknown: 2, Low: 3 };

function enrichScanRow(row: MenuCautionRow, profile: Profile): EnrichedScanRow {
  const lang = profile.language;
  const { risk, allergenMatches, dietMatches } = scoreMenuRow(row, profile, lang);
  const matchedDish =
    (row.matchedDishId && dishes.find((d) => d.id === row.matchedDishId)) ||
    findDishStrict(`${row.english} ${row.thai}`);
  const dishForPhrase = matchedDish ?? syntheticDishFromRow(row);
  const proteinHint = buildProteinHint(row.proteinOptions, profile, lang);
  const uncertain =
    row.confidence === "Low" && (risk === "High" || risk === "Medium");

  return {
    ...row,
    risk,
    uncertain,
    allergenMatches,
    dietMatches,
    proteinHint,
    matchedDish,
    askVendorTH: buildThaiPhrase(profile, dishForPhrase),
    askVendorUserLang: romanizePhrase(profile, dishForPhrase, lang),
  };
}

function sortEnrichedRows(rows: EnrichedScanRow[]): EnrichedScanRow[] {
  return [...rows].sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);
}

function AppChip({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={cn(
        "min-h-12 rounded-chip border px-4 py-2 text-left text-sm font-bold transition active:scale-[0.98]",
        active
          ? "border-primary bg-primary text-white shadow-lift"
          : "border-border bg-white text-foreground hover:bg-muted",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}
        <h2 className="text-xl font-black leading-tight text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [profileLoadState, setProfileLoadState] = useState<ProfileLoadState>("loading");
  const [profileReady, setProfileReady] = useState(false);
  const [profileName, setProfileName] = useState("Traveler profile");
  const [mode, setMode] = useState<Mode>("photo");
  const [screen, setScreen] = useState<Screen>("home");
  const [query, setQuery] = useState("Pad Thai");
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<AnalysisResult>(() => scoreDish(dishes[0], defaultProfile));
  const [vendorQuestionIndex, setVendorQuestionIndex] = useState(0);

  const t = copy[profile.language];
  const suggestions = useMemo(() => {
    const clean = query.trim().toLowerCase();
    if (!clean) return dishes.slice(0, 6);
    return dishes
      .filter((dish) =>
        [dish.english, dish.thai, dish.romanized, dish.category]
          .join(" ")
          .toLowerCase()
          .includes(clean),
      )
      .slice(0, 6);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    const storedResult = window.localStorage.getItem(CACHE_KEY);

    const applyProfile = (nextProfile: Profile, state: ProfileLoadState, name = "Traveler profile") => {
      if (cancelled) return;
      setProfile(nextProfile);
      setProfileLoadState(state);
      setProfileName(name);
      setProfileReady(true);

      if (storedResult) {
        const cached = JSON.parse(storedResult) as { dishId: string; profile: Profile };
        const dish = dishes.find((item) => item.id === cached.dishId) ?? dishes[0];
        setResult(scoreDish(dish, nextProfile));
      }
    };

    async function loadProfileFromApi() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) throw new Error("Profile API unavailable");
        const data = (await response.json()) as ApiProfileResponse;
        applyProfile(
          { ...defaultProfile, ...(data.profile ?? {}) },
          "api",
          data.traveler?.name ?? "API traveler profile",
        );
      } catch {
        const storedProfile = window.localStorage.getItem(STORAGE_KEY);
        if (storedProfile) {
          applyProfile({ ...defaultProfile, ...JSON.parse(storedProfile) }, "local", "Cached traveler profile");
          return;
        }
        applyProfile(defaultProfile, "fallback", "Demo traveler profile");
      }
    }

    loadProfileFromApi();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (profileReady) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
    document.documentElement.classList.toggle("high-contrast", profile.highContrast);
    setResult((current) => scoreDish(current.dish, profile));
  }, [profile, profileReady]);

  useEffect(() => {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        dishId: result.dish.id,
        profile,
      }),
    );
  }, [result.dish.id, profile]);

  const analyzeDish = (dish: Dish) => {
    const next = scoreDish(dish, profile);
    setResult(next);
    setQuery(dish.english);
    setScreen("result");
    setVendorQuestionIndex(0);
  };

  const analyzeText = () => analyzeDish(findDish(query));

  const startVoice = () => {
    const speechWindow = window as unknown as WindowWithSpeechRecognition;
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setListening(true);
      window.setTimeout(() => {
        setListening(false);
        setQuery("Som Tum");
        analyzeDish(findDish("Som Tum"));
      }, 900);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "th-TH";
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "Pad Thai";
      setQuery(transcript);
      analyzeDish(findDish(transcript));
    };
    recognition.start();
  };

  const speakThai = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "th-TH";
    utterance.rate = 0.88;
    window.speechSynthesis.speak(utterance);
  };

  const phrase = buildThaiPhrase(profile, result.dish);
  const romanizedPhrase = romanizePhrase(profile, result.dish, profile.language);

  return (
    <main className="min-h-screen w-full pb-28 text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            aria-label="Go home"
            className="flex min-h-12 items-center gap-3 rounded-2xl text-left"
            onClick={() => setScreen("home")}
            type="button"
          >
            <span className="brand-mark shrink-0" aria-hidden="true">
              <span />
            </span>
            <span>
              <span className="block text-2xl font-black leading-none tracking-tight">ThaiSafeBite</span>
              <span className="hidden text-xs font-semibold text-muted-foreground sm:block">{t.intro}</span>
            </span>
          </button>
          <nav aria-label="Primary" className="hidden items-center gap-8 text-sm font-bold text-muted-foreground md:flex">
            <button className="transition hover:text-primary" onClick={() => setScreen("home")} type="button">
              Home
            </button>
            <button
              className="transition hover:text-primary"
              onClick={() => {
                setScreen("home");
                setMode("photo");
              }}
              type="button"
            >
              Scanner
            </button>
            <button className="transition hover:text-primary" onClick={() => setScreen("phrase")} type="button">
              Phrase Card
            </button>
            <button className="transition hover:text-primary" onClick={() => setScreen("result")} type="button">
              AI Assistant
            </button>
          </nav>
          <div className="flex gap-2">
            <button
              aria-label="Toggle high contrast"
              className={cn("grid h-12 w-12 place-items-center rounded-full border border-border bg-white text-secondary shadow-sm", profile.highContrast && "border-foreground bg-foreground text-white")}
              onClick={() => setProfile((current) => ({ ...current, highContrast: !current.highContrast }))}
              type="button"
            >
              <MoonStar className="h-5 w-5" />
            </button>
            <select
              aria-label="Language"
              className="h-12 rounded-full border border-border bg-white px-3 text-sm font-bold text-foreground shadow-sm"
              onChange={(event) => setProfile((current) => ({ ...current, language: event.target.value as Lang }))}
              value={profile.language}
            >
              {Object.keys(languageNames).map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 pt-6 sm:px-6 lg:pt-12">
        {screen !== "home" ? (
          <Button className="w-full justify-start" onClick={() => setScreen("home")} variant="outline">
            <ChevronLeft className="h-5 w-5" />
            {tx(profile.language, "backToCheckAnother")}
          </Button>
        ) : null}

        {screen === "home" ? (
          <HomeScreen
            analyzeDish={analyzeDish}
            analyzeText={analyzeText}
            listening={listening}
            mode={mode}
            profile={profile}
            profileLoadState={profileLoadState}
            profileName={profileName}
            query={query}
            setMode={setMode}
            setProfile={setProfile}
            setQuery={setQuery}
            startVoice={startVoice}
            suggestions={suggestions}
          />
        ) : null}

        {screen === "result" ? (
          <ResultScreen
            result={result}
            profile={profile}
            t={t}
            onOpenPhrase={() => setScreen("phrase")}
            onSpeak={() => speakThai(phrase)}
          />
        ) : null}

        {screen === "phrase" ? (
          <PhraseScreen
            dish={result.dish}
            phrase={phrase}
            profile={profile}
            romanizedPhrase={romanizedPhrase}
            speakThai={speakThai}
            t={t}
            vendorQuestionIndex={vendorQuestionIndex}
            setVendorQuestionIndex={setVendorQuestionIndex}
          />
        ) : null}
      </div>

      {screen !== "home" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-6xl px-4 safe-area-bottom sm:px-6">
          <div className="contrast-panel rounded-2xl border border-border bg-white p-3 shadow-soft">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
              <p className="text-sm font-bold leading-snug text-foreground">{t.disclaimer}</p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function HomeScreen({
  analyzeDish,
  analyzeText,
  listening,
  mode,
  profile,
  profileLoadState,
  profileName,
  query,
  setMode,
  setProfile,
  setQuery,
  startVoice,
  suggestions,
}: {
  analyzeDish: (dish: Dish) => void;
  analyzeText: () => void;
  listening: boolean;
  mode: Mode;
  profile: Profile;
  profileLoadState: ProfileLoadState;
  profileName: string;
  query: string;
  setMode: (mode: Mode) => void;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  setQuery: (query: string) => void;
  startVoice: () => void;
  suggestions: Dish[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanInfo, setScanInfo] = useState("");
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanningFrame, setScanningFrame] = useState(false);
  const [menuScanRows, setMenuScanRows] = useState<MenuCautionRow[]>([]);

  const openMenuUpload = () => {
    setUploadError("");
    setScanError("");
    setScanInfo("");
    fileInputRef.current?.click();
  };

  const handleMenuUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError(tx(profile.language, "pleaseChooseImage"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        setUploadError(tx(profile.language, "couldNotReadImage"));
        return;
      }
      setCapturedFrame(result);
      setUploadedFile(file);
      setMenuScanRows([]);
      setScanError("");
      setScanInfo("");
    };
    reader.onerror = () => setUploadError(tx(profile.language, "couldNotReadImage"));
    reader.readAsDataURL(file);
  };

  const clearUpload = () => {
    setCapturedFrame(null);
    setUploadedFile(null);
    setMenuScanRows([]);
    setUploadError("");
    setScanError("");
    setScanInfo("");
  };

  const scanCameraFrame = async () => {
    if (!uploadedFile || scanningFrame) return;

    setScanningFrame(true);
    setScanError("");
    setScanInfo("");

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("language", profile.language);

    try {
      const resp = await fetch(`${backendUrl}/api/scan-menu`, {
        method: "POST",
        body: formData,
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        let detail = text;
        try {
          detail = JSON.parse(text).detail ?? text;
        } catch {
          // not JSON, leave as text
        }
        setScanError(`${tx(profile.language, "scanFailed")} (${resp.status}). ${detail || tx(profile.language, "tryAgain")}`);
        setMenuScanRows([]);
        return;
      }

      const data: { rows?: ServerMenuRow[] } = await resp.json();
      const rows = (data.rows ?? []).map(mapServerRow).filter((row): row is MenuCautionRow => row !== null);

      if (!rows.length) {
        setScanInfo(tx(profile.language, "noMenuDetected"));
      }
      setMenuScanRows(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setScanError(`${tx(profile.language, "cannotReachService")} ${message}`);
      setMenuScanRows([]);
    } finally {
      setScanningFrame(false);
    }
  };

  const toggleAllergen = (allergen: Allergen) => {
    setProfile((current) => ({
      ...current,
      allergens: current.allergens.includes(allergen)
        ? current.allergens.filter((item) => item !== allergen)
        : [...current.allergens, allergen],
    }));
  };

  const toggleDiet = (diet: Diet) => {
    setProfile((current) => ({
      ...current,
      diets: current.diets.includes(diet)
        ? current.diets.filter((item) => item !== diet)
        : [...current.diets, diet],
    }));
  };

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">{tx(profile.language, "menuScannerEyebrow")}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-secondary sm:text-5xl">
            {tx(profile.language, "menuScannerTitle")}
          </h1>
        </div>
        <p className="max-w-xl text-base font-semibold leading-relaxed text-muted-foreground">
          {tx(profile.language, "menuScannerSub")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
      <Card className="contrast-panel order-2 overflow-hidden lg:order-2">
        <CardHeader className="bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{tx(profile.language, "apiProfileEyebrow")}</p>
              <h1 className="text-2xl font-black leading-tight">{tx(profile.language, "foodNeedsApplied")}</h1>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{profileName}</p>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              {profileLoadState === "loading"
                ? tx(profile.language, "profileLoading")
                : profileLoadState === "api"
                  ? tx(profile.language, "profileApi")
                  : profileLoadState === "local"
                    ? tx(profile.language, "profileLocal")
                    : tx(profile.language, "profileDemo")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(allergenLabels) as Allergen[]).map((allergen) => (
              <AppChip
                active={profile.allergens.includes(allergen)}
                key={allergen}
                onClick={() => toggleAllergen(allergen)}
              >
                <span className="mr-2">{allergenLabels[allergen].icon}</span>
                {allergenLabel(allergen, profile.language)}
              </AppChip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(dietLabels) as Diet[]).map((diet) => (
              <AppChip active={profile.diets.includes(diet)} key={diet} onClick={() => toggleDiet(diet)}>
                <span className="mr-2">{dietLabels[diet].icon}</span>
                {dietLabel(diet, profile.language)}
              </AppChip>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="contrast-panel order-1 overflow-hidden lg:order-1">
        <CardHeader>
          <SectionTitle eyebrow="Menu scanner" title="Scan a menu or ask about a dish" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2 rounded-[1.25rem] bg-muted p-1">
            {[
              { id: "photo", label: tx(profile.language, "modeMenu"), icon: Camera },
              { id: "voice", label: tx(profile.language, "modeVoice"), icon: Mic },
              { id: "type", label: tx(profile.language, "modeType"), icon: Search },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  className={cn(
                    "min-h-14 rounded-2xl text-sm font-black transition",
                    mode === item.id ? "bg-white text-primary shadow-sm" : "text-muted-foreground",
                  )}
                  key={item.id}
                  onClick={() => setMode(item.id as Mode)}
                  type="button"
                >
                  <Icon className="mx-auto mb-1 h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {mode === "photo" ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-secondary/25 bg-[#082f2f] shadow-lift">
                <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between">
                  <Badge className="bg-black/45 text-white backdrop-blur-md">Menu OCR + vision demo</Badge>
                  <Badge className="bg-accent text-accent-foreground">
                    {capturedFrame ? "UPLOADED" : "MENU"}
                  </Badge>
                </div>

                <div className="relative aspect-[4/5] min-h-80">
                  {capturedFrame ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt="Uploaded menu photo"
                      className="absolute inset-0 h-full w-full object-cover"
                      src={capturedFrame}
                    />
                  ) : null}

                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_38%,rgba(8,47,47,0.48)_74%)]" />
                  <div className="pointer-events-none absolute inset-7 rounded-[1.35rem] border-2 border-white/80 shadow-[0_0_0_999px_rgba(8,47,47,0.18)]" />
                  <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/80" />
                  {scanningFrame ? (
                    <div className="pointer-events-none absolute inset-x-8 top-1/2 h-1 rounded-full bg-primary shadow-[0_0_28px_rgba(6,191,174,0.95)]" />
                  ) : null}

                  {!capturedFrame ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="grid h-16 w-16 place-items-center rounded-[1.35rem] bg-white/15 backdrop-blur-md">
                        <Upload className="h-8 w-8" />
                      </div>
                      <h3 className="mt-4 text-2xl font-black leading-tight">{tx(profile.language, "uploadMenuPhoto")}</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/75">
                        {tx(profile.language, "uploadDescription")}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <input
                accept="image/*"
                className="hidden"
                onChange={handleMenuUpload}
                ref={fileInputRef}
                type="file"
              />

              {uploadError ? (
                <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm font-bold text-foreground">
                  {uploadError}
                </div>
              ) : null}

              {scanError ? (
                <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm font-bold text-foreground">
                  {scanError}
                </div>
              ) : null}

              {scanInfo ? (
                <div className="rounded-2xl border border-border bg-muted p-3 text-sm font-semibold text-muted-foreground">
                  {scanInfo}
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                {capturedFrame ? (
                  <Button onClick={clearUpload} size="lg" variant="outline">
                    {tx(profile.language, "removeImage")}
                  </Button>
                ) : (
                  <Button onClick={openMenuUpload} size="lg" variant="secondary">
                    <Upload className="h-5 w-5" />
                    {tx(profile.language, "uploadMenu")}
                  </Button>
                )}
                <Button disabled={!capturedFrame || scanningFrame} onClick={scanCameraFrame} size="lg">
                  <Sparkles className="h-5 w-5" />
                  {scanningFrame ? tx(profile.language, "scanning") : tx(profile.language, "scanMenu")}
                </Button>
              </div>
              <Button className="w-full" onClick={() => setMenuScanRows(sampleMenuRows)} size="lg" variant="outline">
                {tx(profile.language, "useSampleMenu")}
              </Button>

              {menuScanRows.length ? (
                <MenuCautionTable analyzeDish={analyzeDish} profile={profile} rows={menuScanRows} />
              ) : null}
            </div>
          ) : null}

          {mode === "voice" ? (
            <div className="rounded-[1.25rem] bg-muted p-4 text-center">
              <Button className="w-full" onClick={startVoice} size="lg" variant={listening ? "secondary" : "default"}>
                <AudioLines className="h-5 w-5" />
                {listening ? "Listening..." : "Say a dish name"}
              </Button>
              <p className="mt-3 text-sm font-semibold text-muted-foreground">
                Try “Pad Thai”, “Som Tum”, or “ต้มยำกุ้ง”.
              </p>
            </div>
          ) : null}

          {mode === "type" ? (
            <div className="space-y-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  className="h-14 w-full rounded-[1.25rem] border border-border bg-white pl-12 pr-4 text-lg font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Pad Thai, ส้มตำ, Khao Soi..."
                  value={query}
                />
              </label>
              <Button className="w-full" onClick={analyzeText} size="lg">
                <Sparkles className="h-5 w-5" />
                Estimate risk
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            <p className="text-sm font-black text-muted-foreground">{tx(profile.language, "offlinePopularDishes")}</p>
            <div className="grid gap-2">
              {suggestions.map((dish) => (
                <button
                  className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-border bg-white p-3 text-left transition hover:bg-muted"
                  key={dish.id}
                  onClick={() => analyzeDish(dish)}
                  type="button"
                >
                  <span>
                    <span className="block text-base font-black">{dish.english}</span>
                    <span className="block text-sm font-semibold text-muted-foreground">
                      {dish.thai} · {dish.romanized}
                    </span>
                  </span>
                  <Badge className={riskStyles[dish.baseRisk]}>{dish.baseRisk}</Badge>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}

function ResultScreen({
  onOpenPhrase,
  onSpeak,
  profile,
  result,
  t,
}: {
  onOpenPhrase: () => void;
  onSpeak: () => void;
  profile: Profile;
  result: AnalysisResult;
  t: Record<string, string>;
}) {
  return (
    <>
      <Card className="contrast-panel overflow-hidden">
        <CardHeader className="bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-primary">{result.dish.thai}</p>
              <h1 className="text-3xl font-black leading-tight">{result.dish.english}</h1>
              <p className="text-base font-semibold text-muted-foreground">{result.dish.romanized}</p>
            </div>
            <Badge className={cn("text-base", riskStyles[result.risk])}>
              {riskIcon[result.risk]} {result.risk}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{t.riskEstimate}</p>
              <p className="mt-1 text-2xl font-black">{result.risk}</p>
            </div>
            <div className="rounded-2xl bg-muted p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{t.confidence}</p>
              <p className="mt-1 text-2xl font-black">{result.confidence}</p>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-[#ccfbf1] bg-[#f0fdfa] p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <h2 className="text-lg font-black">{tx(profile.language, "possibleMatch")}</h2>
                <ul className="mt-2 space-y-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                  {result.riskReasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <InfoBlock title={t.commonlyContains}>
            {result.dish.commonlyContains.length ? (
              <div className="grid grid-cols-2 gap-2">
                {result.dish.commonlyContains.map((ingredient) => (
                  <div className="rounded-2xl border border-border bg-white p-3" key={ingredient.key}>
                    <span className="text-2xl">{ingredient.icon}</span>
                    <p className="mt-1 text-sm font-black">{ingredient.label}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-semibold text-muted-foreground">{tx(profile.language, "noOfflineCommonIngredients")}</p>
            )}
          </InfoBlock>

          <InfoBlock title={t.hiddenAsks}>
            <div className="flex flex-wrap gap-2">
              {result.dish.hiddenAsks.map((ask) => (
                <Badge className="bg-muted text-foreground" key={ask}>
                  <CircleHelp className="mr-1 h-4 w-4" />
                  {ask}
                </Badge>
              ))}
            </div>
          </InfoBlock>

          <InfoBlock title={t.crossContact}>
            <div className="grid gap-2">
              {result.dish.crossContact.map((warning) => (
                <div className="flex items-center gap-3 rounded-2xl bg-muted p-3 text-sm font-bold" key={warning}>
                  <Utensils className="h-5 w-5 text-secondary" />
                  {warning}
                </div>
              ))}
            </div>
          </InfoBlock>

          <div className="grid gap-3">
            <Button className="w-full" onClick={onOpenPhrase} size="lg" variant="secondary">
              <Languages className="h-5 w-5" />
              {tx(profile.language, "openPhraseCard")}
            </Button>
            <Button className="w-full" onClick={onSpeak} size="lg" variant="outline">
              <Volume2 className="h-5 w-5" />
              {tx(profile.language, "playThaiAudio")}
            </Button>
          </div>
        </CardContent>
      </Card>

    </>
  );
}

const VENDOR_QUESTIONS = [
  { thai: "ใส่ถั่วไหม?", en: "Does it contain peanuts?" },
  { thai: "มีน้ำปลา กะปิ หรือกุ้งแห้งไหม?", en: "Fish sauce, shrimp paste, or dried shrimp?" },
  { thai: "ใช้น้ำมันหรือกระทะร่วมกันไหม?", en: "Shared oil, wok, or tools?" },
  { thai: "ทำแบบไม่ใส่ไข่/น้ำปลาได้ไหม?", en: "Can you make it without egg or fish sauce?" },
];

function PhraseScreen({
  dish,
  phrase,
  profile,
  romanizedPhrase,
  setVendorQuestionIndex,
  speakThai,
  t,
  vendorQuestionIndex,
}: {
  dish: Dish;
  phrase: string;
  profile: Profile;
  romanizedPhrase: string;
  setVendorQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  speakThai: (text: string) => void;
  t: Record<string, string>;
  vendorQuestionIndex: number;
}) {
  const currentQuestion = VENDOR_QUESTIONS[vendorQuestionIndex % VENDOR_QUESTIONS.length];
  const profileItems = [
    ...profile.allergens.map((allergen) => `${allergenLabels[allergen].icon} ${allergenLabel(allergen, profile.language)}`),
    ...profile.diets.map((diet) => `${dietLabels[diet].icon} ${dietLabel(diet, profile.language)}`),
  ];

  return (
    <>
      <Card className="contrast-panel overflow-hidden">
        <CardHeader className="bg-primary text-white">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/75">{t.phrase}</p>
          <h1 className="text-3xl font-black leading-tight">{t.showThisToVendor ?? "Show this to the vendor"}</h1>
          <p className="font-semibold text-white/80">
            {dish.english} · {dish.thai}
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="rounded-[1.25rem] border-2 border-primary bg-white p-5 text-center">
            <p className="text-2xl font-bold leading-relaxed text-foreground whitespace-pre-line text-left">{phrase}</p>
          </div>
          <div className="rounded-[1.25rem] bg-muted p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{t.romanizedMeaning ?? "Romanized meaning"}</p>
            <p className="mt-2 text-base font-semibold leading-relaxed whitespace-pre-line">{romanizedPhrase}</p>
          </div>
          <Button className="w-full" onClick={() => speakThai(phrase)} size="lg">
            <Volume2 className="h-5 w-5" />
            {t.playAudio ?? "Play polite Thai audio"}
          </Button>
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardHeader>
          <SectionTitle eyebrow={tx(profile.language, "showVendor")} title={t.vendor} />
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            className="min-h-48 w-full rounded-[1.25rem] bg-primary p-5 text-center text-white shadow-lift transition active:scale-[0.99]"
            onClick={() => setVendorQuestionIndex((index) => index + 1)}
            type="button"
          >
            <p className="text-3xl font-black leading-snug">{currentQuestion.thai}</p>
            <p className="mt-3 text-base font-semibold text-white/80">{currentQuestion.en}</p>
            <p className="mt-4 text-sm font-bold text-white/70">{tx(profile.language, "tapToFlip")}</p>
          </button>
          <div className="grid grid-cols-3 gap-2">
            <VendorAnswer icon={<Check className="h-5 w-5" />} label="ใส่" sub={tx(profile.language, "vendorContains")} />
            <VendorAnswer icon={<X className="h-5 w-5" />} label="ไม่ใส่" sub={tx(profile.language, "vendorNo")} />
            <VendorAnswer icon={<CircleHelp className="h-5 w-5" />} label="ไม่แน่ใจ" sub={tx(profile.language, "vendorNotSure")} />
          </div>
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardHeader>
          <SectionTitle
            eyebrow={t.apiProfileEyebrow ?? "Your profile"}
            title={t.yourProfileTitle ?? "What this phrase checks"}
          />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profileItems.length ? (
            profileItems.map((item) => (
              <Badge className="bg-muted text-foreground" key={item}>
                {item}
              </Badge>
            ))
          ) : (
            <p className="font-semibold text-muted-foreground">{t.noProfileSelected ?? "No allergies or diets selected yet."}</p>
          )}
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardContent className="space-y-3 pt-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-secondary" />
            <div>
              <h2 className="text-xl font-black">{t.askThenDecide ?? "Ask, then decide"}</h2>
              <p className="mt-1 text-base font-semibold leading-relaxed text-muted-foreground">
                {t.crossContactNote ?? "We estimate possible ingredients from common recipes. Street food varies by vendor, and cross-contact can happen with mortars, woks, oil, spoons, and cutting boards."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function MenuCautionTable({
  analyzeDish,
  profile,
  rows,
}: {
  analyzeDish: (dish: Dish) => void;
  profile: Profile;
  rows: MenuCautionRow[];
}) {
  const enriched = useMemo(
    () => sortEnrichedRows(rows.map((row) => enrichScanRow(row, profile))),
    [rows, profile],
  );

  const summary = useMemo(() => {
    const counts: Record<Risk, number> = { High: 0, Medium: 0, Low: 0, Unknown: 0 };
    for (const row of enriched) counts[row.risk]++;
    return counts;
  }, [enriched]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/70 p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{tx(profile.language, "cautionTable")}</p>
          <h3 className="mt-1 text-xl font-black text-secondary">{tx(profile.language, "menuScanResults")}</h3>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">
            {tx(profile.language, "sortedByRisk")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          {(["High", "Medium", "Low", "Unknown"] as Risk[])
            .filter((r) => summary[r] > 0)
            .map((r) => (
              <Badge className={cn("text-xs", riskStyles[r])} key={r}>
                {riskIcon[r]} {summary[r]} {r}
              </Badge>
            ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full border-collapse text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="border-b border-border px-4 py-3 font-black">{tx(profile.language, "colMenuItem")}</th>
              <th className="border-b border-border px-4 py-3 font-black">{tx(profile.language, "colPossibleCautions")}</th>
              <th className="border-b border-border px-4 py-3 font-black">{tx(profile.language, "colRisk")}</th>
              <th className="border-b border-border px-4 py-3 font-black">{tx(profile.language, "colAskVendor")}</th>
              <th className="border-b border-border px-4 py-3 font-black">{tx(profile.language, "colAction")}</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((row) => (
              <MenuCautionTableRow key={row.id} row={row} lang={profile.language} onReview={analyzeDish} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-[#f0fdfa] p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm font-bold leading-relaxed text-secondary">
            {tx(profile.language, "ocrFooterNote")}
          </p>
        </div>
      </div>
    </section>
  );
}

function MenuCautionTableRow({
  row,
  lang,
  onReview,
}: {
  row: EnrichedScanRow;
  lang: Lang;
  onReview: (dish: Dish) => void;
}) {
  return (
    <tr className="align-top">
      <td className="border-b border-border px-4 py-4 align-top">
        <p className="text-base font-black text-secondary">{row.thai}</p>
        <p className="mt-1 font-semibold text-muted-foreground">{row.english}</p>
        <p className="mt-2 text-xs font-black text-primary">{row.price}</p>
      </td>

      <td className="border-b border-border px-4 py-4 align-top">
        <div className="flex flex-wrap gap-1.5">
          {row.likelyContains.map((ingredient) => {
            const isAllergenHit = row.allergenMatches.some((m) => ingredient.flags.includes(m.flag));
            const isDietHit = row.dietMatches.some((m) => ingredient.flags.includes(m.flag));
            return (
              <Badge
                className={cn(
                  "text-xs",
                  isAllergenHit
                    ? "bg-rose-100 text-rose-900 border border-rose-200"
                    : isDietHit
                      ? "bg-amber-100 text-amber-900 border border-amber-200"
                      : "bg-muted text-foreground",
                )}
                key={ingredient.key}
              >
                <span className="mr-1">{ingredient.icon}</span>
                {ingredient.label}
              </Badge>
            );
          })}
        </div>

        {row.allergenMatches.length ? (
          <ul className="mt-2 space-y-0.5 text-xs font-semibold text-rose-700">
            {Array.from(new Set(row.allergenMatches.map((m) => `${m.ingredient} → ${labelForFlag(m.flag, lang)}`))).map(
              (line) => (
                <li key={line}>🚫 {line}</li>
              ),
            )}
          </ul>
        ) : null}

        {row.dietMatches.length ? (
          <ul className="mt-2 space-y-0.5 text-xs font-semibold text-amber-800">
            {Array.from(new Set(row.dietMatches.map((m) => `${m.ingredient} → ${labelForFlag(m.flag, lang)}`))).map(
              (line) => (
                <li key={line}>⚠️ {line}</li>
              ),
            )}
          </ul>
        ) : null}

        {row.proteinHint ? (
          <p className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1 text-xs font-bold text-emerald-900">
            💡 {row.proteinHint.note}
          </p>
        ) : null}

        {row.cautionNotes.length ? (
          <ul className="mt-2 space-y-0.5 text-xs font-semibold text-muted-foreground">
            {row.cautionNotes.slice(0, 2).map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        ) : null}
      </td>

      <td className="border-b border-border px-4 py-4 align-top whitespace-nowrap">
        <Badge className={cn(riskStyles[row.risk], row.uncertain && "opacity-80")}>
          {riskIcon[row.risk]} {row.risk}
          {row.uncertain ? "?" : ""}
        </Badge>
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          {tx(lang, "confidence")}: {row.confidence}
        </p>
      </td>

      <td className="border-b border-border px-4 py-4 align-top">
        <p className="text-sm font-bold leading-snug text-secondary whitespace-pre-line">{row.askVendorTH}</p>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground whitespace-pre-line">
          {row.askVendorUserLang}
        </p>
      </td>

      <td className="border-b border-border px-4 py-4 align-top">
        {row.matchedDish ? (
          <Button onClick={() => onReview(row.matchedDish!)} size="sm" variant="outline">
            {tx(lang, "review")}
          </Button>
        ) : (
          <Badge className="bg-muted text-muted-foreground">{tx(lang, "askOnly")}</Badge>
        )}
      </td>
    </tr>
  );
}

function InfoBlock({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function VendorAnswer({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      className="min-h-24 rounded-2xl border border-border bg-white p-3 text-center shadow-sm transition active:scale-[0.98]"
      type="button"
    >
      <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-muted text-secondary">{icon}</span>
      <span className="mt-2 block text-lg font-black">{label}</span>
      <span className="block text-xs font-bold text-muted-foreground">{sub}</span>
    </button>
  );
}
