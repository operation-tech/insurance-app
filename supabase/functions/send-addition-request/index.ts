/// <reference lib="deno.unstable" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import ExcelJS from "npm:exceljs@4.4.0";

/* ================= CORS ================= */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/* ================= ENV ================= */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID")!;
const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET")!;
const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN")!;
const GMAIL_SENDER = Deno.env.get("GMAIL_SENDER")!;

const TEMPLATE_BUCKET = "insurance_templates";

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

/* ================= HELPERS ================= */
const mapGender = (g?: string | null) =>
  g?.toLowerCase().startsWith("m") ? "M" :
  g?.toLowerCase().startsWith("f") ? "F" : "";

const mapRelation = (r?: string | null): string => {
  if (!r) return "";
  const s = r.toLowerCase().trim();
  if (["principal", "employee", "emp", "e"].includes(s)) return "E";
  if (["wife", "spouse", "w"].includes(s)) return "W";
  if (["husband", "h"].includes(s)) return "H";
  if (["son", "s"].includes(s)) return "S";
  if (["daughter", "d"].includes(s)) return "D";
  return "";
};

const mapPlan = (p?: string | null): string => {
  if (!p) return "";
  const s = p.toLowerCase().trim();
  if (["ga1", "ga2", "ga3", "ga4"].includes(s)) return s.toUpperCase();
  if (s.includes("basic")) return "GA1";
  if (s.includes("silver")) return "GA2";
  if (s.includes("gold")) return "GA3";
  if (s.includes("platinum")) return "GA4";
  return "";
};

const asExcelDate = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
};

const bytesToBase64 = (bytes: Uint8Array) => {
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};

const toBase64Url = (str: string) =>
  btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const formatSubjectDate = (d = new Date()) =>
  d.toISOString().slice(0, 10);

/* ================= GMAIL ================= */
async function getGmailAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GMAIL_CLIENT_ID,
      client_secret: GMAIL_CLIENT_SECRET,
      refresh_token: GMAIL_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });

  const json = await res.json();
console.log("🔑 TOKEN RESPONSE", json);
return json.access_token;

  
}

/* ================= MAIN ================= */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { request_id } = body;

    if (!request_id) {
      return new Response(
        JSON.stringify({ error: "request_id required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    /* ---------- LOAD REQUEST ---------- */
    const { data: reqRow } = await supabase
      .from("requests")
      .select(`
        id,
        request_ref,
        request_type,
        clients:client_id ( company_name, policy_number )
      `)
      .eq("id", request_id)
      .single();

    if (!reqRow) throw new Error("Request not found");

    const { data: members } = await supabase
      .from("request_members")
      .select("*")
      .eq("request_id", request_id);

    const { data: tpl } = await supabase
      .from("insurance_company_templates")
      .select("template_path, email_list, email_body")
      .eq("insurance_company", "AXA")
      .eq("request_type", "addition")
      .single();

    if (!tpl) throw new Error("Insurance template not found");

    /* ---------- LOAD TEMPLATE ---------- */
    const { data: file } = await supabase.storage
      .from(TEMPLATE_BUCKET)
      .download(tpl.template_path);

    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet =
      workbook.getWorksheet("Additions (New Joiners)") ||
      workbook.worksheets[0];

    /* ---------- WRITE DATA ---------- */
    const START_ROW = 12;

    members?.forEach((m, i) => {
      const row = sheet.getRow(START_ROW + i);

      row.getCell(1).value = i + 1;
      row.getCell(2).value = reqRow.clients?.policy_number || "";
      row.getCell(3).value = reqRow.clients?.company_name || "";
      row.getCell(4).value = m.name || "";
      row.getCell(5).value = mapRelation(m.relation);
      row.getCell(6).value = mapPlan(m.plan);

      const dob = asExcelDate(m.dob);
      row.getCell(7).value = dob;
      if (dob) row.getCell(7).numFmt = "dd/mm/yyyy";

      row.getCell(8).value = mapGender(m.gender);

      const addDate = asExcelDate(m.addition_date);
      row.getCell(9).value = addDate;
      if (addDate) row.getCell(9).numFmt = "dd/mm/yyyy";

      row.getCell(14).value = m.nid || "";
      row.getCell(18).value = m.email || "";
      row.getCell(19).value = m.phone || "";

      row.commit();
    });

    /* ---------- EMAIL ---------- */
    const outBuffer = await workbook.xlsx.writeBuffer();
    const attachment = bytesToBase64(new Uint8Array(outBuffer));

    const requestTypeLabel =
      reqRow.request_type === "addition"
        ? "Addition"
        : reqRow.request_type === "deletion"
        ? "Deletion"
        : "Update";

    const clientName = reqRow.clients?.company_name ?? "UNKNOWN CLIENT";

    const emailSubject = `${reqRow.request_ref} | ${clientName} | ${requestTypeLabel} | ${formatSubjectDate()}`;

    console.log("📧 Sending email", {
      to: tpl.email_list,
      subject: emailSubject,
      from: GMAIL_SENDER,
    });

    const boundary = "axa-boundary";
    const filename = `${reqRow.request_ref}_AXA_Additions.xlsx`;

    const mime = [
      `From: ${GMAIL_SENDER}`,
      `To: ${tpl.email_list.join(", ")}`,
      `Subject: ${emailSubject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      "Content-Type: text/plain; charset=UTF-8",
      "",
      tpl.email_body,
      "",
      `--${boundary}`,
      `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
      "Content-Transfer-Encoding: base64",
      `Content-Disposition: attachment; filename="${filename}"`,
      "",
      attachment,
      "",
      `--${boundary}--`,
    ].join("\r\n");

    const token = await getGmailAccessToken();

    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: toBase64Url(mime) }),
      }
    );

    console.log("📨 Gmail response status:", gmailRes.status);

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      throw new Error(`Gmail send failed: ${gmailRes.status} ${errText}`);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    console.error("❌ Function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
