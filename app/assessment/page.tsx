"use client";

import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  FileText,
  HeartPulse,
  ScanSearch,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "office-relief-patient-intake";

type PatientIntake = {
  age: string;
  gender: "male" | "female" | "other";
  workDevice: "desktop" | "laptop" | "tablet";
  workStyle: "sit" | "stand" | "mixed";
  dominantHand: "right" | "left" | "both";
};

export default function AssessmentPage() {
  const [savedProfile, setSavedProfile] = useState<PatientIntake | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      setSavedProfile(JSON.parse(raw) as PatientIntake);
    } catch {
      // ignore bad local data
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f8fb] px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <a href="/persona" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-800">
          <ArrowLeft size={14} />
          กลับไปหน้า Patient Profile
        </a>

        <div className="mt-6 overflow-hidden rounded-[36px] border border-white/80 bg-white/92 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 via-white to-cyan-50 px-8 py-6 sm:px-10">
            <div className="flex flex-wrap items-center gap-3">
              {[
                { step: "1", label: "Login", active: false },
                { step: "2", label: "Patient Profile", active: false },
                { step: "3", label: "Assessment", active: true },
              ].map((item, index) => (
                <div key={item.step} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold",
                      item.active ? "bg-teal-600 text-white" : "bg-white text-slate-600 border border-slate-200",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black",
                        item.active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700",
                      )}
                    >
                      {item.step}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {index < 2 ? <div className="hidden h-px w-6 bg-slate-200 sm:block" /> : null}
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-teal-600">Next Step Mockup</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  เลือกขั้นตอนถัดไปของการประเมินอาการ
                </h1>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600 sm:text-base">
                  หลังจากบันทึกข้อมูลผู้ป่วยแล้ว หน้านี้ควรเป็นจุดที่ชวนให้ผู้ใช้ไปต่อได้ง่าย ว่าจะเริ่มทำแบบประเมินอาการ
                  ดูข้อมูลสรุป หรือไปยังผลลัพธ์เบื้องต้นของระบบ
                </p>
              </div>

              <div className="rounded-3xl bg-white p-4 text-teal-700 shadow-sm">
                <ClipboardCheck size={30} />
              </div>
            </div>
          </div>

          <div className="px-8 py-8 sm:px-10">
            <div className="rounded-[32px] bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500 p-6 text-white shadow-[0_24px_80px_rgba(20,184,166,0.28)]">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-2xl">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/75">Primary Action</p>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">เริ่มทำแบบประเมินอาการเบื้องต้น</h2>
                  <p className="mt-3 text-sm font-medium leading-7 text-white/85">
                    ปุ่มหลักนี้ควรเป็นสิ่งแรกที่ผู้ใช้กดต่อ เพื่อเริ่มตอบคำถามเรื่องตำแหน่งที่ปวด ระดับความปวด อาการชา ร้าว
                    หรือข้อจำกัดในการเคลื่อนไหว
                  </p>
                </div>

                <div className="flex min-w-[240px] flex-col gap-3">
                  <Button asChild className="h-12 rounded-2xl bg-slate-950 text-base hover:bg-black">
                    <a href="/persona">
                      เริ่มแบบประเมิน
                      <ArrowRight size={16} />
                    </a>
                  </Button>
                  <div className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90">
                    ตอนนี้ยังเป็น mockup
                    <span className="mt-1 block text-xs font-medium text-white/70">
                      ใช้ card นี้เป็นตัวแทนปุ่มไป flow ถัดไปในเดโม่
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <ActionCard
                accent="teal"
                cta="เปิดหน้าคำถาม"
                desc="เริ่ม flow การถามอาการ เช่น ปวดตรงไหน ปวดเท่าไร มีอาการชาหรือร้าวหรือไม่"
                icon={<HeartPulse size={20} />}
                title="แบบประเมินอาการ"
              />
              <ActionCard
                accent="slate"
                cta="ดูข้อมูลล่าสุด"
                desc="ใช้ข้อมูลจาก Patient Profile ที่บันทึกไว้ เพื่อให้ทีมเห็นบริบทก่อนเริ่มประเมินจริง"
                icon={<FileText size={20} />}
                title="สรุปข้อมูลผู้ป่วย"
              />
              <ActionCard
                accent="cyan"
                cta="ไปหน้าผลลัพธ์"
                desc="ต่อยอดไปเป็นหน้าผลเบื้องต้น คำแนะนำ หรือหน้าที่ให้เริ่มทำ movement assessment"
                icon={<ScanSearch size={20} />}
                title="ผลลัพธ์ถัดไป"
              />
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[28px] border border-teal-100 bg-teal-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-teal-700">พร้อมใช้งานหรือยัง</p>
                <p className="mt-3 text-sm font-medium leading-7 text-teal-900">
                  {savedProfile
                    ? "พบข้อมูลผู้ป่วยที่บันทึกไว้แล้ว ดังนั้นหน้านี้สามารถใช้เป็นจุดเริ่มของขั้นตอนประเมินอาการต่อได้ทันที"
                    : "ยังไม่พบข้อมูลผู้ป่วยที่บันทึกไว้ แนะนำให้กลับไปหน้า Patient Profile ก่อน แล้วค่อยกดเข้ามาหน้านี้อีกครั้ง"}
                </p>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Quick Summary</p>
                <div className="mt-4 space-y-3">
                  <SummaryItem label="อายุ" value={savedProfile?.age || "-"} />
                  <SummaryItem label="อุปกรณ์หลัก" value={savedProfile ? deviceText(savedProfile.workDevice) : "-"} />
                  <SummaryItem label="ลักษณะงาน" value={savedProfile ? workStyleText(savedProfile.workStyle) : "-"} />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-2xl bg-teal-600 px-6 hover:bg-teal-700">
                <a href="/persona">กลับไปแก้ข้อมูลผู้ป่วย</a>
              </Button>
              <Button asChild className="h-12 rounded-2xl px-6" variant="outline">
                <a href="/">กลับหน้าแรก</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  accent,
  icon,
  title,
  desc,
  cta,
}: {
  accent: "teal" | "slate" | "cyan";
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <button
      className={cn(
        "group rounded-[28px] border p-5 text-left transition hover:-translate-y-1 hover:shadow-lg",
        accent === "teal" && "border-teal-100 bg-teal-50/70 hover:border-teal-200",
        accent === "slate" && "border-slate-200 bg-slate-50 hover:border-slate-300",
        accent === "cyan" && "border-cyan-100 bg-cyan-50/70 hover:border-cyan-200",
      )}
      type="button"
    >
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm",
          accent === "teal" && "text-teal-700",
          accent === "slate" && "text-slate-700",
          accent === "cyan" && "text-cyan-700",
        )}
      >
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-black text-slate-900">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-7 text-slate-600">{desc}</p>
      <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-slate-900">
        <span>{cta}</span>
        <span className="transition group-hover:translate-x-1">→</span>
      </div>
    </button>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function deviceText(value: PatientIntake["workDevice"]) {
  if (value === "desktop") return "Desktop";
  if (value === "laptop") return "Laptop";
  return "Tablet";
}

function workStyleText(value: PatientIntake["workStyle"]) {
  if (value === "sit") return "นั่งหน้าจอต่อเนื่อง";
  if (value === "stand") return "ยืนทำงานเป็นหลัก";
  return "เดินสลับนั่ง";
}
