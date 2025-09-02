import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, k = 6 } = req.body || {};
    if (!query) return res.status(400).json({ error: "Missing query" });

    const emb = await oai.embeddings.create({
      model: "text-embedding-3-small",
      input: query
    });
    const queryEmbedding = emb.data[0].embedding;

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: k
    });
    if (error) return res.status(500).json({ error: error.message });

    res.json({ matches: data });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
