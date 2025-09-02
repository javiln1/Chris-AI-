import OpenAI from "openai";

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY is missing. Add it to .env.local");
    process.exit(1);
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const r = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: "hello"
  });
  console.log("✅ OpenAI key works. Embedding dims:", r.data[0].embedding.length);
}
main().catch(e => {
  console.error("❌ OpenAI check failed:", e.message);
  process.exit(1);
});
