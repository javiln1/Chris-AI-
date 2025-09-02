import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536-dim
export const CHUNK_SIZE = 1200;
export const CHUNK_OVERLAP = 200;

export const norm = (v) => String(v ?? "").trim();

export function chunkText(text, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const clean = norm(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks = [];
  let i = 0;
  while (i < clean.length) {
    const end = i + size;
    chunks.push(clean.slice(i, end));
    i = end - overlap;
    if (i <= 0) i = 0;
    if (i >= clean.length) break;
  }
  return chunks;
}

export async function embedBatch(texts) {
  const res = await oai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts
  });
  return res.data.map((d) => d.embedding);
}

export async function replaceDoc(docId, rows) {
  // idempotent upsert: delete old rows for this docId, then insert new ones
  await supabase.from("documents").delete().eq("doc_id", docId);
  const { error } = await supabase.from("documents").insert(rows);
  if (error) throw error;
}

export async function upsertChunks(docId, chunks, meta = {}) {
  const BATCH = 64;
  const rows = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH);
    const embeddings = await embedBatch(slice);
    slice.forEach((content, j) => {
      rows.push({
        doc_id: docId,
        chunk_index: i + j,
        content,
        metadata: meta,
        embedding: embeddings[j]
      });
    });
  }
  await replaceDoc(docId, rows);
  return rows.length;
}
