import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const key = process.env.GEMINI_API_KEY!;
const client = new GoogleGenerativeAI(key);

// جرّب الموديلات المرشحة
const candidates = [
  "gemini-3.8-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-2.0-flash-001",
  "gemini-flash-latest",
];

async function main() {
  for (const m of candidates) {
    try {
      const model = client.getGenerativeModel({ model: m });
      const res = await model.generateContent("Say hi");
      console.log("OK: " + m + " -> " + res.response.text().slice(0, 40));
    } catch (e: any) {
      const msg = e?.message?.slice(0, 100) ?? "error";
      console.log("FAIL: " + m + " -> " + msg);
    }
  }
}

main().catch(console.error);