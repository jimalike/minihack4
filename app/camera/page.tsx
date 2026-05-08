"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CameraPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/body-map");
  }, [router]);

  return null;
}
