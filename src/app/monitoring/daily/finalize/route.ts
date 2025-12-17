// /app/api/monitoring/daily/finalize/route.ts
import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getServerSupabase } from "@/lib/supabase/server";
import { Buffer } from "node:buffer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { form_date, leader, depo, signature_base64 } = body as {
      form_date: string;
      leader: string;
      depo: string;
      signature_base64: string;
    };

    if (!form_date || !leader || !depo || !signature_base64) {
      return NextResponse.json({ error: "Param kurang" }, { status: 400 });
    }

    const supabase = await getServerSupabase();

    // 1) Tarik SEMUA data (samakan nama tabel dg skema kamu)
    const [checklist, evaluasi, target, project, agenda, achievement] =
      await Promise.all([
        supabase
          .from("monitoring_checklist_values")
          .select("*")
          .eq("form_date", form_date)
          .eq("leader", leader)
          .eq("depo", depo),
        supabase
          .from("monitoring_evaluasi_values")
          .select("*")
          .eq("form_date", form_date)
          .eq("leader", leader)
          .eq("depo", depo),
        supabase
          .from("monitoring_target_values")
          .select("*")
          .eq("form_date", form_date)
          .eq("leader", leader)
          .eq("depo", depo),
        supabase
          .from("monitoring_project_values")
          .select("*")
          .eq("form_date", form_date)
          .eq("leader", leader)
          .eq("depo", depo),
        supabase
          .from("monitoring_agenda_values")
          .select("*")
          .eq("form_date", form_date)
          .eq("leader", leader)
          .eq("depo", depo),
        supabase
          .from("monitoring_achievement_values")
          .select("*")
          .eq("form_date", form_date)
          .eq("leader", leader)
          .eq("depo", depo),
      ]);

    // 2) Buat PDF in-memory
    const doc = new PDFDocument({ margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    const finish = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(16).text("LEADER MONITORING DAILY", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Tanggal: ${form_date}`);
    doc.text(`Leader: ${leader}`);
    doc.text(`Depo: ${depo}`);
    doc.moveDown();

    const section = (title: string) => {
      doc.moveDown().fontSize(12).text(title, { underline: true });
      doc.moveDown(0.25).fontSize(10);
    };

    section("Checklist Area");
    (checklist.data ?? []).forEach((row: any) => {
      doc.text(
        `- ${row.section_title ?? row.section_id} / ${
          row.field_label ?? row.field_id
        }: ${row.value_display ?? row.value_number ?? row.value_text ?? ""}`
      );
    });

    section("Evaluasi Tim");
    (evaluasi.data ?? []).forEach((row: any) => {
      doc.text(
        `- ${row.item ?? row.field_label ?? ""}: ${
          row.value ?? row.value_text ?? ""
        }`
      );
    });

    section("Target & Achievement");
    (target.data ?? []).forEach((row: any) => {
      doc.text(
        `- ${row.item ?? row.field_label ?? ""}: ${
          row.value ?? row.value_text ?? ""
        }`
      );
    });

    section("Project Tracking");
    (project.data ?? []).forEach((row: any) => {
      doc.text(
        `- ${row.item ?? row.field_label ?? ""}: ${
          row.value ?? row.value_text ?? ""
        }`
      );
    });

    section("Agenda & Jadwal");
    (agenda.data ?? []).forEach((row: any) => {
      doc.text(
        `- ${row.item ?? row.field_label ?? ""}: ${
          row.value ?? row.value_text ?? ""
        }`
      );
    });

    section("Achievement");
    (achievement.data ?? []).forEach((row: any) => {
      doc.text(
        `- ${row.item ?? row.field_label ?? ""}: ${
          row.value ?? row.value_text ?? ""
        }`
      );
    });

    // Signature
    doc.moveDown();
    doc.text("Tanda Tangan Leader:", { continued: false });
    try {
      const base64 = signature_base64.replace(/^data:image\/\w+;base64,/, "");
      const imgBuf = Buffer.from(base64, "base64");
      doc.image(imgBuf, { fit: [200, 80] });
    } catch {
      doc.text("[TTD tidak valid]");
    }

    doc.end();
    const pdfBuffer = await finish;

    // 3) Upload ke Storage
    const safeLeader = leader.replace(/[^\w.-]+/g, "_");
    const safeDepo = depo.replace(/[^\w.-]+/g, "_");
    const filePath = `daily/${safeDepo}/${form_date}-${safeLeader}.pdf`;

    const upload = await supabase.storage
      .from("monitoring-pdf")
      .upload(filePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (upload.error) {
      return NextResponse.json(
        { error: upload.error.message },
        { status: 500 }
      );
    }

    const { data: publicUrl } = supabase.storage
      .from("monitoring-pdf")
      .getPublicUrl(filePath);

    // 4) Catat riwayat
    await supabase.from("monitoring_pdf_history").insert({
      form_date,
      leader,
      depo,
      url: publicUrl.publicUrl,
      created_at: new Date().toISOString(),
    });

    // 5) RESET data input (hapus semua yang terkait kombinasi ini)
    await Promise.all([
      supabase
        .from("monitoring_checklist_values")
        .delete()
        .eq("form_date", form_date)
        .eq("leader", leader)
        .eq("depo", depo),
      supabase
        .from("monitoring_evaluasi_values")
        .delete()
        .eq("form_date", form_date)
        .eq("leader", leader)
        .eq("depo", depo),
      supabase
        .from("monitoring_target_values")
        .delete()
        .eq("form_date", form_date)
        .eq("leader", leader)
        .eq("depo", depo),
      supabase
        .from("monitoring_project_values")
        .delete()
        .eq("form_date", form_date)
        .eq("leader", leader)
        .eq("depo", depo),
      supabase
        .from("monitoring_agenda_values")
        .delete()
        .eq("form_date", form_date)
        .eq("leader", leader)
        .eq("depo", depo),
      supabase
        .from("monitoring_achievement_values")
        .delete()
        .eq("form_date", form_date)
        .eq("leader", leader)
        .eq("depo", depo),
    ]);

    return NextResponse.json({ ok: true, url: publicUrl.publicUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
