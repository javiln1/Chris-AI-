import axios from "axios";
import Papa from "papaparse";
import { chunkText, upsertChunks, norm } from "./ingest_shared.js";

const SHEET_URL = process.env.SHEET_CSV_URL;

function toTxtExportUrl(url) {
  // Works for public Google Docs links
  if (!url.includes("docs.google.com/document")) return null;
  
  // Remove any existing query parameters
  const baseUrl = url.split('?')[0];
  
  if (baseUrl.includes("/edit")) {
    return baseUrl.replace("/edit", "/export?format=txt");
  }
  
  if (!baseUrl.endsWith("/")) {
    return baseUrl + "/export?format=txt";
  }
  
  return baseUrl + "export?format=txt";
}

function slugify(s) {
  return norm(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function fetchGoogleDocTxt(link) {
  const txtUrl = toTxtExportUrl(link);
  if (!txtUrl) return null;
  try {
    const response = await axios.get(txtUrl, { 
      responseType: "text",
      maxRedirects: 10,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    return String(response.data || "");
  } catch (error) {
    console.log(`Failed to fetch ${link}: ${error.message}`);
    return null; // likely private doc
  }
}

async function fetchTextForRow(row) {
  const link = norm(row["Transcript"]) || norm(row["Transcript "]) || norm(row["transcript"]) || "";
  const sourceType = norm(row["source_type"]) || "doc";
  if (!link) return "";

  if (sourceType === "doc" && link.includes("docs.google.com/document")) {
    return (await fetchGoogleDocTxt(link)) || "";
  }
  if (sourceType === "txt") {
    try {
      const { data } = await axios.get(link, { responseType: "text" });
      return String(data || "");
    } catch { return ""; }
  }
  // TODO: pdf / youtube support later
  return "";
}

async function main() {
  if (!SHEET_URL) {
    console.error("Missing SHEET_CSV_URL in .env.local");
    process.exit(1);
  }

  const { data: csv } = await axios.get(SHEET_URL, { responseType: "text" });
  const parsed = Papa.parse(csv, { header: true });
  const rows = parsed.data.filter(Boolean);

  let totalDocs = 0, totalChunks = 0;

  for (const row of rows) {
    const status = norm(row["status"]) || "active";
    if (status !== "active") continue;

    const title = norm(row["Title"]) || norm(row["title"]) || "";
    const docIdSheet = norm(row["doc_id"]);
    const category = norm(row["category"]);
    const language = norm(row["language"]);

    const text = await fetchTextForRow(row);
    if (!text) {
      console.warn(`Skipping (empty or private) → ${title}`);
      continue;
    }
    


    const chunks = chunkText(text, 1200, 200);
    if (!chunks.length) continue;

    const docId = docIdSheet || `${slugify(title)}-${category || "doc"}`;
    const meta = {
      title,
      source_url: norm(row["Transcript"]) || norm(row["transcript"]),
      source_type: norm(row["source_type"]) || "doc",
      language,
      category,
      imported_at: new Date().toISOString()
    };

    const inserted = await upsertChunks(docId, chunks, meta);
    totalDocs += 1;
    totalChunks += inserted;
    console.log(`✔ ${docId} — ${inserted} chunks`);
  }

  console.log(`\n✅ Reindex finished. Docs: ${totalDocs}, Chunks: ${totalChunks}`);
}

main().catch(e => { console.error(e); process.exit(1); });
