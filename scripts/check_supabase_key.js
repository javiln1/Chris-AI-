import { createClient } from "@supabase/supabase-js";

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase.from("documents").select("id").limit(1);

  if (error) {
    console.error("❌ Supabase connection failed:", error.message);
    process.exit(1);
  }

  console.log("✅ Supabase connection works. Found rows in documents:", data.length);
}

main();
