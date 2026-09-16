"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function requireBiz() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: member } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!member) redirect("/setup");
  return { supabase, businessId: member.business_id as string };
}

export async function addMenuItem(formData: FormData) {
  const { supabase, businessId } = await requireBiz();
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Item name is required.");
  const priceRaw = String(formData.get("price") || "").trim();
  await supabase.from("menu_items").insert({
    business_id: businessId,
    name,
    category: String(formData.get("category") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    price: priceRaw ? parseFloat(priceRaw) : null,
    image_url: String(formData.get("image_url") || "").trim() || null,
  });
  revalidatePath("/dashboard/menu");
}

export async function deleteMenuItem(id: string) {
  const { supabase } = await requireBiz();
  await supabase.from("menu_items").delete().eq("id", id);
  revalidatePath("/dashboard/menu");
}

export async function toggleMenuItem(id: string, active: boolean) {
  const { supabase } = await requireBiz();
  await supabase.from("menu_items").update({ active }).eq("id", id);
  revalidatePath("/dashboard/menu");
}

/** Clean an AI reply down to a single plain description sentence. */
function cleanDescription(raw: string): string {
  let t = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const quoted = t.match(/"([^"]{8,})"/);
  if (quoted) {
    t = quoted[1];
  } else if (/\n/.test(t)) {
    // reasoning models dump multiple lines — keep the last real line
    const lines = t.split("\n").map((s) => s.trim()).filter(Boolean);
    t = lines[lines.length - 1] || t;
  }
  t = t.replace(/^["'\-*\s]*\d*[).]?\s*/, "").replace(/["']+$/g, "").trim();
  // keep to the first sentence if it's long
  const m = t.match(/^[^.!?]{15,}[.!?]/);
  if (m) t = m[0].trim();
  return t;
}

/**
 * Generate a short menu-item description with AI (optional).
 * Works with any OpenAI-compatible API (default: Groq — free, no card).
 * Uses the item name, category, and — if a vision model is available — the photo.
 * Runs on the server so the key never reaches the browser.
 */
export async function generateDescription(
  name: string,
  category?: string,
  imageUrl?: string
): Promise<{ ok: boolean; text?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in." };

  const key = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://api.groq.com/openai/v1";
  if (!key) return { ok: false, error: "AI isn't set up. Add AI_API_KEY to .env.local to enable it." };
  if (!name.trim()) return { ok: false, error: "Enter the item name first." };

  // Discover which models this key can actually use.
  let chatModel = process.env.AI_MODEL || "";
  let visionModel = "";
  try {
    const mr = await fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${key}` } });
    if (mr.ok) {
      const mj = await mr.json();
      const ids: string[] = (mj?.data || []).map((m: { id?: string }) => m.id || "").filter(Boolean);
      const notChat = /guard|whisper|tts|prompt|embed|moderat|classif/i;
      const reasoning = /r1|qwq|reason|think|distill/i;
      const isVision = /vision|llava|scout|maverick/i;
      const usable = ids.filter((id) => !notChat.test(id));
      visionModel = usable.find((id) => isVision.test(id)) || "";
      if (!chatModel) {
        const plain = usable.filter((id) => !reasoning.test(id) && !isVision.test(id));
        chatModel =
          plain.find((id) => /llama|gemma|qwen|mixtral|instant|versatile/i.test(id)) ||
          plain[0] ||
          usable[0] ||
          "";
      }
    }
  } catch {
    /* ignore — fall back below */
  }
  if (!chatModel) chatModel = "llama-3.1-8b-instant";

  const useVision = !!(imageUrl && visionModel);
  const model = useVision ? visionModel : chatModel;

  const sys =
    "You write one short, appetizing café/restaurant menu description. Reply with ONLY the description — a single sentence, max 15 words, no emojis, no quotes, no analysis, no preamble.";
  const userText = `Item: "${name}"${category ? `, category: ${category}` : ""}. Write its menu description in one sentence.`;
  const userContent = useVision
    ? [
        { type: "text", text: `${userText} Use the photo for accuracy.` },
        { type: "image_url", image_url: { url: imageUrl } },
      ]
    : userText;

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        max_tokens: 120,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const e = await res.json();
        detail = e?.error?.message || JSON.stringify(e).slice(0, 160);
      } catch {
        detail = await res.text().catch(() => "");
      }
      return { ok: false, error: `AI error ${res.status}: ${detail || "check key/model"}` };
    }

    const j = await res.json();
    const raw: string = j?.choices?.[0]?.message?.content?.trim() || "";
    if (!raw) return { ok: false, error: "No description returned. Try again." };
    const text = cleanDescription(raw);
    return { ok: true, text: text || raw };
  } catch {
    return { ok: false, error: "Couldn't reach the AI service." };
  }
}
