import cron from "node-cron";
import { spawn } from "child_process";

function run(script) {
  return new Promise((resolve, reject) => {
    const p = spawn("npm", ["run", script], { stdio: "inherit", shell: true });
    p.on("close", code => (code === 0 ? resolve(null) : reject(new Error(`Exit ${code}`))));
  });
}

console.log("⏱️ Cron started — reindex every 15 minutes");
cron.schedule("*/15 * * * *", async () => {
  console.log("🔄 Running reindex…");
  try {
    await run("reindex");
    console.log("✅ Reindex OK");
  } catch (e) {
    console.error("❌ Reindex failed:", e.message);
  }
});
