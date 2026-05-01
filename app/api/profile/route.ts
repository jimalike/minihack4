import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    traveler: {
      name: "Guest tourist",
    },
    profile: {
      allergens: ["peanut", "shellfish"],
      diets: ["halal"],
      highContrast: false,
      language: "EN",
    },
    updatedAt: new Date().toISOString(),
  });
}
