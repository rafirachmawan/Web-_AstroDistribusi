export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

type Row = { k: string; v: any };

async function makePdfBuffer(params: {
  form_date: string;
  depo?: string;
  leader: string;
  signature_base64: string;
  snapshot?: {
    checklist?: Row[];
    evaluasi?: Row[];
    target?: Row[];
    projects?: Row[];
    agenda?: Row[];
    achievement?: Row[];
  };
}): Promise<Buffer> {
  const PDFKit = (await import("pdfkit")).default as any;
  const { form_date, depo = "", leader, signature_base64, snapshot } = params;

  const doc = new PDFKit({ margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done: Promise<void> = new Promise((res) => doc.on("end", () => res()));

  doc.fontSize(16).text("LEADER MONITORING DAILY – REKAP", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Tanggal: ${form_date}`);
  if (leader) doc.text(`Leader: ${leader}`);
  if (depo) doc.text(`Depo: ${depo}`);

  function drawSection(title: string, rows?: Row[]) {
    if (!rows || !rows.length) return;
    doc.moveDown().fontSize(13).text(title, { underline: true });
    doc.moveDown(0.2).fontSize(10);
    rows.forEach((r) => {
      doc.text(`• ${r.k}: ${r.v ?? ""}`);
    });
  }

  // tulis snapshot seluruh modul
  drawSection("Checklist Area", snapshot?.checklist);
  drawSection("Evaluasi Tim", snapshot?.evaluasi);
  drawSection("Target & Achievement", snapshot?.target);
  drawSection("Project Tracking", snapshot?.projects);
  drawSection("Agenda & Jadwal", snapshot?.agenda);
  drawSection("Achievement", snapshot?.achievement);

  // tanda tangan
  doc.moveDown();
  doc.fontSize(12).text("Tanda Tangan:", { underline: true });
  try {
    const base64 = signature_base64.includes(",")
      ? signature_base64.split(",")[1]
      : signature_base64;
    const sig = Buffer.from(base64, "base64");
    // @ts-ignore
    doc.image(sig, { fit: [220, 110] });
  } catch {}

  doc.end();
  await done;
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.form_date || !body?.leader || !body?.signature_base64) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const pdfBuffer = await makePdfBuffer(body);
    const safeLeader = String(body.leader).replace(/[^\w.-]+/g, "_");
    const fileName = `monitoring/${safeLeader}_${body.form_date}.pdf`;

    const { error } = await supabase.storage
      .from("pdfs")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
