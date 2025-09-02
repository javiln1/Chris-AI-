import axios from "axios";
import Papa from "papaparse";

async function main() {
  if (!process.env.SHEET_CSV_URL) {
    console.error("❌ SHEET_CSV_URL is missing in .env.local");
    process.exit(1);
  }

  try {
    const { data } = await axios.get(process.env.SHEET_CSV_URL, { responseType: "text" });
    const parsed = Papa.parse(data, { header: true });
    console.log("✅ Sheet loaded. First 2 rows:\n", parsed.data.slice(0, 2));
  } catch (e) {
    console.error("❌ Failed to fetch sheet:", e.message);
    process.exit(1);
  }
}

main();
