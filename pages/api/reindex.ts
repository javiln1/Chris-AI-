// Minimal POST endpoint that runs npm run reindex
import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // Optional simple auth:
  // if (req.headers.authorization !== `Bearer ${process.env.REINDEX_SECRET}`) return res.status(401).json({ error: "Unauthorized" });

  const child = spawn("npm", ["run", "reindex"], { stdio: "inherit", shell: true });
  child.on("close", (code) => {
    if (code === 0) return res.status(200).json({ ok: true });
    return res.status(500).json({ ok: false, code });
  });
}
