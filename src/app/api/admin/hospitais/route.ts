import { NextResponse } from "next/server";
import { ensureDemoInvite } from "@/lib/ensure-demo-invite";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const n = await prisma.hospital.count();
    if (n === 0) {
      await ensureDemoInvite();
    }
  } catch (e) {
    console.error("[admin/hospitais] bootstrap demo:", e);
  }

  const rows = await prisma.hospital.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows);
}
