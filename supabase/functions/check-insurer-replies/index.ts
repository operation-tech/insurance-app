/// <reference lib="deno.unstable" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const isCron = req.headers.get("user-agent")?.includes("PostgreSQL");

console.log(
  isCron ? "⏰ INVOKED BY CRON" : "🧪 MANUAL INVOCATION",
  new Date().toISOString()
);


/* ---------------- CORS ---------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

/* ---------------- SUPABASE ---------------- */
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

/* ---------------- GMAIL ENV ---------------- */
const GMAIL_CLIENT_ID = Deno.env.get("GMAIL_CLIENT_ID");
const GMAIL_CLIENT_SECRET = Deno.env.get("GMAIL_CLIENT_SECRET");
const GMAIL_REFRESH_TOKEN = Deno.env.get("GMAIL_REFRESH_TOKEN");

if (
  !GMAIL_CLIENT_ID ||
  !GMAIL_CLIENT_SECRET ||
  !GMAIL_REFRESH_TOKEN
) {
  console.error("❌ Missing Gmail environment variables");
  throw new Error("Missing Gmail environment variables");
}

/* ---------------- GMAIL TOKEN ---------------- */
async function getGmailAccessToken(): Promise<string> {
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

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ Gmail token error:", err);
    throw new Error("Failed to refresh Gmail token");
  }

  const json = await res.json();
  return json.access_token;
}

/* ---------------- HELPERS ---------------- */
const decodeBase64 = (data?: string) =>
  data ? atob(data.replace(/-/g, "+").replace(/_/g, "/")) : "";

function extractBody(payload: any): string {
  if (payload?.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  if (payload?.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part);
      if (text) return text;
    }
  }

  return "";
}

/* ---------------- PARSE INSURER TABLE ---------------- */
function parseCardTable(body: string) {
  const lines = body.split(/\r?\n/);
  const results: { nid: string; card: string }[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.toLowerCase().includes("national id")) continue;

    const parts = line.trim().split(/\t|\s{2,}/);
    if (parts.length < 11) continue;

    const nid = parts[9]?.trim();
    const card = parts[10]?.trim();

    if (nid && card) {
      results.push({ nid, card });
    }
  }

  return results;
}

/* ---------------- MAIN ---------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    console.log("⏰ CRON TRIGGERED AT:", new Date().toISOString());

    const token = await getGmailAccessToken();

    /* LIMIT workload to avoid cron timeout */
    const { data: requests, error: reqErr } = await supabase
      .from("requests")
      .select("id, request_ref")
      .eq("status", "sent_to_insurer")
      .limit(5);

    if (reqErr) throw reqErr;

    if (!requests || requests.length === 0) {
      console.log("ℹ️ No pending requests");
      return new Response(
        JSON.stringify({ ok: true, processed: 0 }),
        { headers: corsHeaders }
      );
    }

    let processed = 0;

    for (const r of requests) {
      const query = `in:inbox ${r.request_ref}`;

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!listRes.ok) continue;

      const listJson = await listRes.json();
      const messages = Array.isArray(listJson.messages)
        ? listJson.messages
        : [];

      for (const m of messages) {
        /* Idempotency check */
        const { data: exists } = await supabase
          .from("insurer_replies")
          .select("id")
          .eq("gmail_message_id", m.id)
          .maybeSingle();

        if (exists) continue;

        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!msgRes.ok) continue;

        const msg = await msgRes.json();
        const body = extractBody(msg.payload);

        console.log("📩 Reply found for:", r.request_ref);

        const { data: replyRow, error: insErr } = await supabase
          .from("insurer_replies")
          .insert({
            request_id: r.id,
            gmail_message_id: m.id,
            gmail_thread_id: msg.threadId,
            body,
            received_at: new Date(Number(msg.internalDate)).toISOString(),
            cards_processed: false,
          })
          .select()
          .single();

        if (insErr) {
          console.error("❌ Insert insurer_replies failed:", insErr);
          continue;
        }

        const parsedCards = parseCardTable(body);
        console.log("📊 Parsed cards:", parsedCards.length);

        for (const c of parsedCards) {
          const { error: updErr, count } = await supabase
            .from("request_members")
            .update({ card_number: c.card })
            .eq("request_id", r.id)
            .eq("nid", c.nid)
            .select({ count: "exact" });

          if (updErr) {
            console.error("❌ Member update failed:", updErr);
          } else {
            console.log(`🔄 Updated NID ${c.nid} → ${count} rows`);
          }
        }

        await supabase
          .from("insurer_replies")
          .update({ cards_processed: true })
          .eq("id", replyRow.id);

        processed++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, processed }),
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("🔥 Function crashed:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: corsHeaders }
    );
  }
});
