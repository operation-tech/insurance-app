/// <reference lib="deno.unstable" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

/* ---------------- CONFIG ---------------- */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

/* ---------------- GMAIL TOKEN ---------------- */
async function getGmailAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: Deno.env.get("GMAIL_CLIENT_ID")!,
      client_secret: Deno.env.get("GMAIL_CLIENT_SECRET")!,
      refresh_token: Deno.env.get("GMAIL_REFRESH_TOKEN")!,
      grant_type: "refresh_token",
    }),
  });

  const json = await res.json();
  if (!json.access_token) throw json;
  return json.access_token as string;
}

/* ---------------- BODY EXTRACTION ---------------- */
function decodeBase64(data?: string): string {
  if (!data) return "";
  return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
}

function extractAllText(payload: any): string {
  let text = "";

  if (payload?.body?.data) {
    text += decodeBase64(payload.body.data) + "\n";
  }

  if (payload?.parts) {
    for (const part of payload.parts) {
      text += extractAllText(part);
    }
  }

  return text
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/* ---------------- CARD PARSER ---------------- */
/**
 * Looks for:
 * - 14 digit NID
 * - Card number (10–25 chars, alphanumeric)
 * Works on messy HTML text
 */
function parseCards(text: string) {
  const results: { nid: string; card: string }[] = [];

  const regex =
    /(\d{14})\s+(?:card|policy|member|no|number)?\s*[:\-]?\s*([A-Z0-9\-]{6,25})/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    results.push({
      nid: match[1].trim(),
      card: match[2].trim(),
    });
  }

  return results;
}

/* ---------------- MAIN ---------------- */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const token = await getGmailAccessToken();

    const { data: requests, error: reqErr } = await supabase
      .from("requests")
      .select("id, request_ref")
      .eq("status", "sent_to_insurer");

    if (reqErr) throw reqErr;

    let updated = 0;
    let parsed = 0;

    for (const r of requests ?? []) {
      const q = `in:inbox ${r.request_ref}`;

      const listRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(
          q,
        )}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const listJson = await listRes.json();
      const messages = listJson.messages ?? [];

      for (const m of messages) {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=full`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        const msg = await msgRes.json();
        const text = extractAllText(msg.payload);

        const cards = parseCards(text);
        parsed += cards.length;

        for (const c of cards) {
          const { error, count } = await supabase
            .from("request_members")
            .update({ card_number: c.card })
            .eq("request_id", r.id)
            .eq("nid", c.nid)
            .select("*", { count: "exact" });

          if (!error && count && count > 0) {
            updated += count;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        parsed,
        updated,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Fatal error:", e);
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: corsHeaders },
    );
  }
});
