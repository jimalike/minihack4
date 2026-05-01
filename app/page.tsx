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

const copy: Record<Lang, Record<string, string>> = {
  EN: {
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
};

const allergenLabels: Record<Allergen, { label: string; icon: string; thai: string }> = {
  peanut: { label: "Peanut", icon: "🥜", thai: "ถั่วลิสง" },
  treeNuts: { label: "Tree nuts", icon: "🌰", thai: "ถั่วเปลือกแข็ง" },
  shellfish: { label: "Shellfish", icon: "🦐", thai: "กุ้ง ปู หอย" },
  fish: { label: "Fish", icon: "🐟", thai: "ปลา" },
  egg: { label: "Egg", icon: "🥚", thai: "ไข่" },
  soy: { label: "Soy", icon: "🫘", thai: "ถั่วเหลือง" },
  milk: { label: "Milk", icon: "🥛", thai: "นม" },
  gluten: { label: "Gluten", icon: "🌾", thai: "กลูเตน/แป้งสาลี" },
  sesame: { label: "Sesame", icon: "⚪", thai: "งา" },
};

const dietLabels: Record<Diet, { label: string; thai: string; icon: string }> = {
  vegan: { label: "Vegan", thai: "วีแกน", icon: "🌱" },
  vegetarian: { label: "Vegetarian", thai: "มังสวิรัติ", icon: "🥬" },
  halal: { label: "Halal", thai: "ฮาลาล", icon: "🌙" },
  glutenFree: { label: "Gluten-free", thai: "ไม่มีกลูเตน", icon: "🌾" },
};

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

  return {
    id: `scan-${index}-${slugify(row.english || row.thai)}`,
    thai: row.thai || row.english,
    english: row.english || row.thai,
    price: row.price?.trim() || "—",
    confidence: row.confidence,
    likelyContains: ingredients,
    cautionNotes: Array.isArray(row.cautionNotes) ? row.cautionNotes : [],
    askVendor: row.askVendor || "",
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

function scoreMenuRow(row: MenuCautionRow, profile: Profile) {
  const sensitivities = [...profile.allergens, ...profile.diets];
  const matches = row.likelyContains.flatMap((ingredient) =>
    ingredient.flags
      .filter((flag) => sensitivities.includes(flag as never))
      .map((flag) => ({ flag, ingredient: ingredient.label })),
  );
  const directAllergen = matches.some((match) => profile.allergens.includes(match.flag as Allergen));
  const directDietConflict = matches.some((match) => profile.diets.includes(match.flag as Diet));

  let risk: Risk = row.cautionNotes.length ? "Medium" : "Unknown";
  if (directAllergen || (directDietConflict && profile.diets.some((diet) => ["vegan", "vegetarian", "halal"].includes(diet)))) {
    risk = "High";
  } else if (directDietConflict || matches.length > 0) {
    risk = "Medium";
  }

  const reasons = matches.length
    ? Array.from(new Set(matches.map((match) => `${match.ingredient} may conflict with ${labelForFlag(String(match.flag))}`)))
    : ["Recipe varies by vendor. Use this as a question list, not a safety guarantee."];

  return { risk, reasons };
}

function labelForFlag(flag: string) {
  if (flag in allergenLabels) return allergenLabels[flag as Allergen].label;
  if (flag in dietLabels) return dietLabels[flag as Diet].label;
  return flag;
}

function buildThaiPhrase(profile: Profile, dish: Dish) {
  const allergyText = profile.allergens.map((allergen) => allergenLabels[allergen].thai).join(" และ ");
  const dietText = profile.diets.map((diet) => dietLabels[diet].thai).join(" และ ");
  const askParts = [
    allergyText ? `ฉันแพ้${allergyText}` : "",
    dietText ? `ฉันทาน${dietText}` : "",
  ].filter(Boolean);
  const riskyIngredients = Array.from(
    new Set(
      dish.commonlyContains
        .filter((ingredient) =>
          ingredient.flags.some((flag) => [...profile.allergens, ...profile.diets].includes(flag as never)),
        )
        .map((ingredient) => ingredient.label),
    ),
  );
  const mappedIngredients = riskyIngredients
    .map((ingredient) => {
      const dictionary: Record<string, string> = {
        "Fish sauce": "น้ำปลา",
        "Shrimp paste": "กะปิ",
        Peanuts: "ถั่วลิสง",
        Egg: "ไข่",
        "Oyster sauce": "น้ำมันหอย",
        "Dried shrimp": "กุ้งแห้ง",
        "Bone broth": "น้ำซุปกระดูก",
        "Soy sauce": "ซีอิ๊ว",
        "Wheat noodles": "เส้นที่มีแป้งสาลี",
      };
      return dictionary[ingredient] ?? ingredient;
    })
    .join(" หรือ ");

  const intro = askParts.length ? askParts.join(" และ ") : "ฉันมีข้อจำกัดเรื่องอาหาร";
  const ingredientAsk = mappedIngredients
    ? `เมนู${dish.thai}มี${mappedIngredients}ไหมคะ`
    : `เมนู${dish.thai}มีส่วนผสมที่ควรระวังไหมคะ`;

  return `สวัสดีค่ะ ${intro} ${ingredientAsk} และใช้อุปกรณ์หรือน้ำมันร่วมกับอาหารที่มีส่วนผสมนี้ไหมคะ`;
}

function romanizePhrase(profile: Profile, dish: Dish) {
  const items = [
    ...profile.allergens.map((allergen) => allergenLabels[allergen].label),
    ...profile.diets.map((diet) => dietLabels[diet].label),
  ];
  const needs = items.length ? items.join(", ") : "dietary restrictions";
  return `Sawasdee kha. I have ${needs}. Does ${dish.english} contain risky ingredients, or share tools or oil with them?`;
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
  const romanizedPhrase = romanizePhrase(profile, result.dish);

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
            Back to check another dish
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
            phrase={phrase}
            romanizedPhrase={romanizedPhrase}
            vendorQuestionIndex={vendorQuestionIndex}
            setVendorQuestionIndex={setVendorQuestionIndex}
            analyzeDish={analyzeDish}
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
      setUploadError("Please choose an image file (JPG, PNG, HEIC).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        setUploadError("Could not read this image. Try another one.");
        return;
      }
      setCapturedFrame(result);
      setUploadedFile(file);
      setMenuScanRows([]);
      setScanError("");
      setScanInfo("");
    };
    reader.onerror = () => setUploadError("Could not read this image. Try another one.");
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
        setScanError(`Scan failed (${resp.status}). ${detail || "Try again."}`);
        setMenuScanRows([]);
        return;
      }

      const data: { rows?: ServerMenuRow[] } = await resp.json();
      const rows = (data.rows ?? []).map(mapServerRow).filter((row): row is MenuCautionRow => row !== null);

      if (!rows.length) {
        setScanInfo("No menu items detected. Try a clearer photo of the menu board.");
      }
      setMenuScanRows(rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setScanError(`Could not reach the scan service. ${message}`);
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
          <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">Menu scanner</p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight text-secondary sm:text-5xl">
            Scan Thai menus, then ask better questions.
          </h1>
        </div>
        <p className="max-w-xl text-base font-semibold leading-relaxed text-muted-foreground">
          Your API profile is applied automatically. We estimate risk, then help you confirm with the vendor.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.18fr_0.82fr] lg:items-start">
      <Card className="contrast-panel order-2 overflow-hidden lg:order-2">
        <CardHeader className="bg-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">API profile</p>
              <h1 className="text-2xl font-black leading-tight">Food needs applied</h1>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">{profileName}</p>
            </div>
            <Badge className="bg-primary text-primary-foreground">
              {profileLoadState === "loading"
                ? "Loading"
                : profileLoadState === "api"
                  ? "From API"
                  : profileLoadState === "local"
                    ? "Cached"
                    : "Demo"}
            </Badge>
          </div>
          <p className="text-base font-medium leading-relaxed text-muted-foreground">
            This profile is used for every menu row and dish result. Chips remain adjustable for demo testing.
          </p>
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
                {allergenLabels[allergen].label}
              </AppChip>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(dietLabels) as Diet[]).map((diet) => (
              <AppChip active={profile.diets.includes(diet)} key={diet} onClick={() => toggleDiet(diet)}>
                <span className="mr-2">{dietLabels[diet].icon}</span>
                {dietLabels[diet].label}
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
              { id: "photo", label: "Menu", icon: Camera },
              { id: "voice", label: "Voice", icon: Mic },
              { id: "type", label: "Type", icon: Search },
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
                      <h3 className="mt-4 text-2xl font-black leading-tight">Upload a menu photo</h3>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/75">
                        Pick a photo of the menu board and we&apos;ll turn it into a caution table you can act on.
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
                    Remove image
                  </Button>
                ) : (
                  <Button onClick={openMenuUpload} size="lg" variant="secondary">
                    <Upload className="h-5 w-5" />
                    Upload menu
                  </Button>
                )}
                <Button disabled={!capturedFrame || scanningFrame} onClick={scanCameraFrame} size="lg">
                  <Sparkles className="h-5 w-5" />
                  {scanningFrame ? "Scanning menu..." : "Scan menu"}
                </Button>
              </div>
              <Button className="w-full" onClick={() => setMenuScanRows(sampleMenuRows)} size="lg" variant="outline">
                Use sample Thai menu
              </Button>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                <input
                  className="h-14 w-full rounded-[1.25rem] border border-border bg-white pl-12 pr-4 text-base font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Optional menu hint, e.g. curry, fried rice"
                  value={query}
                />
              </label>
              <p className="text-sm font-semibold leading-relaxed text-muted-foreground">
                Demo only: this captures a frame and loads sample OCR results. A real ChatGPT vision/OCR call can plug in here later.
              </p>
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
            <p className="text-sm font-black text-muted-foreground">Offline popular dishes</p>
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
  analyzeDish,
  onOpenPhrase,
  onSpeak,
  phrase,
  profile,
  result,
  romanizedPhrase,
  setVendorQuestionIndex,
  t,
  vendorQuestionIndex,
}: {
  analyzeDish: (dish: Dish) => void;
  onOpenPhrase: () => void;
  onSpeak: () => void;
  phrase: string;
  profile: Profile;
  result: AnalysisResult;
  romanizedPhrase: string;
  setVendorQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  t: Record<string, string>;
  vendorQuestionIndex: number;
}) {
  const safer = result.dish.saferAlternativeIds
    .map((id) => dishes.find((dish) => dish.id === id))
    .filter(Boolean) as Dish[];
  const vendorQuestions = [
    {
      thai: "ใส่ถั่วไหม?",
      en: "Does it contain peanuts?",
    },
    {
      thai: "มีน้ำปลา กะปิ หรือกุ้งแห้งไหม?",
      en: "Fish sauce, shrimp paste, or dried shrimp?",
    },
    {
      thai: "ใช้น้ำมันหรือกระทะร่วมกันไหม?",
      en: "Shared oil, wok, or tools?",
    },
    {
      thai: "ทำแบบไม่ใส่ไข่/น้ำปลาได้ไหม?",
      en: "Can you make it without egg or fish sauce?",
    },
  ];
  const currentQuestion = vendorQuestions[vendorQuestionIndex % vendorQuestions.length];

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
                <h2 className="text-lg font-black">Possible match with your profile</h2>
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
              <p className="font-semibold text-muted-foreground">No common hidden animal or major allergen ingredient in our offline dish data.</p>
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
              Open Thai phrase card
            </Button>
            <Button className="w-full" onClick={onSpeak} size="lg" variant="outline">
              <Volume2 className="h-5 w-5" />
              Play Thai audio
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardHeader>
          <SectionTitle eyebrow="Show vendor" title={t.vendor} />
        </CardHeader>
        <CardContent className="space-y-4">
          <button
            className="min-h-48 w-full rounded-[1.25rem] bg-primary p-5 text-center text-white shadow-lift transition active:scale-[0.99]"
            onClick={() => setVendorQuestionIndex((index) => index + 1)}
            type="button"
          >
            <p className="text-3xl font-black leading-snug">{currentQuestion.thai}</p>
            <p className="mt-3 text-base font-semibold text-white/80">{currentQuestion.en}</p>
            <p className="mt-4 text-sm font-bold text-white/70">Tap to flip question</p>
          </button>
          <div className="grid grid-cols-3 gap-2">
            <VendorAnswer icon={<Check className="h-5 w-5" />} label="ใส่" sub="Contains" />
            <VendorAnswer icon={<X className="h-5 w-5" />} label="ไม่ใส่" sub="No" />
            <VendorAnswer icon={<CircleHelp className="h-5 w-5" />} label="ไม่แน่ใจ" sub="Not sure" />
          </div>
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardHeader>
          <SectionTitle eyebrow="Lower risk" title={t.safer} />
        </CardHeader>
        <CardContent className="grid gap-3">
          {safer.slice(0, 3).map((dish) => (
            <button
              className="flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-border bg-white p-4 text-left"
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
              <Badge className={riskStyles[scoreDish(dish, profile).risk]}>{scoreDish(dish, profile).risk}</Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardContent className="space-y-3 pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Phrase preview</p>
          <p className="text-xl font-black leading-relaxed">{phrase}</p>
          <p className="text-sm font-semibold leading-relaxed text-muted-foreground">{romanizedPhrase}</p>
        </CardContent>
      </Card>
    </>
  );
}

function PhraseScreen({
  dish,
  phrase,
  profile,
  romanizedPhrase,
  speakThai,
  t,
}: {
  dish: Dish;
  phrase: string;
  profile: Profile;
  romanizedPhrase: string;
  speakThai: (text: string) => void;
  t: Record<string, string>;
}) {
  const profileItems = [
    ...profile.allergens.map((allergen) => `${allergenLabels[allergen].icon} ${allergenLabels[allergen].label}`),
    ...profile.diets.map((diet) => `${dietLabels[diet].icon} ${dietLabels[diet].label}`),
  ];

  return (
    <>
      <Card className="contrast-panel overflow-hidden">
        <CardHeader className="bg-primary text-white">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-white/75">{t.phrase}</p>
          <h1 className="text-3xl font-black leading-tight">Show this to the vendor</h1>
          <p className="font-semibold text-white/80">
            {dish.english} · {dish.thai}
          </p>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <div className="rounded-[1.25rem] border-2 border-primary bg-white p-5 text-center">
            <p className="text-3xl font-black leading-relaxed text-foreground">{phrase}</p>
          </div>
          <div className="rounded-[1.25rem] bg-muted p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Romanized meaning</p>
            <p className="mt-2 text-lg font-bold leading-relaxed">{romanizedPhrase}</p>
          </div>
          <Button className="w-full" onClick={() => speakThai(phrase)} size="lg">
            <Volume2 className="h-5 w-5" />
            Play polite Thai audio
          </Button>
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardHeader>
          <SectionTitle eyebrow="Your profile" title="What this phrase checks" />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profileItems.length ? (
            profileItems.map((item) => (
              <Badge className="bg-muted text-foreground" key={item}>
                {item}
              </Badge>
            ))
          ) : (
            <p className="font-semibold text-muted-foreground">No allergies or diets selected yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="contrast-panel">
        <CardContent className="space-y-3 pt-5">
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-secondary" />
            <div>
              <h2 className="text-xl font-black">Ask, then decide</h2>
              <p className="mt-1 text-base font-semibold leading-relaxed text-muted-foreground">
                We estimate possible ingredients from common recipes. Street food varies by vendor, and cross-contact can happen with mortars, woks, oil, spoons, and cutting boards.
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
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/70 p-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">Caution table</p>
          <h3 className="mt-1 text-xl font-black text-secondary">Sample menu scan results</h3>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">
            Each row is a risk estimate from common recipes. Ask the vendor before ordering.
          </p>
        </div>
        <Badge className="bg-primary text-primary-foreground">Demo OCR</Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <thead className="bg-white text-xs uppercase tracking-[0.12em] text-muted-foreground">
            <tr>
              <th className="border-b border-border px-4 py-3 font-black">Menu item</th>
              <th className="border-b border-border px-4 py-3 font-black">Possible cautions</th>
              <th className="border-b border-border px-4 py-3 font-black">Risk</th>
              <th className="border-b border-border px-4 py-3 font-black">Ask vendor</th>
              <th className="border-b border-border px-4 py-3 font-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const scored = scoreMenuRow(row, profile);
              const matchedDish = row.matchedDishId
                ? dishes.find((dish) => dish.id === row.matchedDishId)
                : undefined;

              return (
                <tr className="align-top" key={row.id}>
                  <td className="border-b border-border px-4 py-4">
                    <p className="text-base font-black text-secondary">{row.thai}</p>
                    <p className="mt-1 font-semibold text-muted-foreground">{row.english}</p>
                    <p className="mt-2 text-xs font-black text-primary">{row.price}</p>
                  </td>
                  <td className="border-b border-border px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {row.likelyContains.map((ingredient) => (
                        <Badge className="bg-muted text-foreground" key={ingredient.key}>
                          <span className="mr-1">{ingredient.icon}</span>
                          {ingredient.label}
                        </Badge>
                      ))}
                    </div>
                    <ul className="mt-3 space-y-1 font-semibold text-muted-foreground">
                      {row.cautionNotes.slice(0, 2).map((note) => (
                        <li key={note}>• {note}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="border-b border-border px-4 py-4">
                    <Badge className={riskStyles[scored.risk]}>
                      {riskIcon[scored.risk]} {scored.risk}
                    </Badge>
                    <p className="mt-2 text-xs font-bold text-muted-foreground">
                      Confidence: {row.confidence}
                    </p>
                  </td>
                  <td className="border-b border-border px-4 py-4">
                    <p className="font-semibold leading-relaxed text-secondary">{row.askVendor}</p>
                    <p className="mt-2 text-xs font-semibold leading-relaxed text-muted-foreground">
                      {scored.reasons[0]}
                    </p>
                  </td>
                  <td className="border-b border-border px-4 py-4">
                    {matchedDish ? (
                      <Button onClick={() => analyzeDish(matchedDish)} size="sm" variant="outline">
                        Review
                      </Button>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Ask only</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-[#f0fdfa] p-4">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm font-bold leading-relaxed text-secondary">
            Menu OCR cannot prove ingredients or cross-contact. Use this table to ask better questions, then confirm with the vendor.
          </p>
        </div>
      </div>
    </section>
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
