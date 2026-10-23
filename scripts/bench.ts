import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { resolve } from "path";
dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function test(m: string) {
  const key = process.env.GEMINI_API_KEY!;
  console.log("Key prefix: " + key.slice(0, 15) + "...");
  const g = new GoogleGenerativeAI(key);
  const model = g.getGenerativeModel({ model: m });
  try {
    const res = await model.generateContent("Say hi");
    console.log(m + " -> OK: " + res.response.text().slice(0, 30));
  } catch (e: any) {
    console.log(m + " -> FAIL");
    console.log("  status: " + e?.status);
    console.log("  message: " + e?.message?.slice(0, 200));
  }
}

async function main() {
  for (const m of ["gemini-flash-latest", "gemini-3.8-flash", "gemini-2.5-flash"]) {
    await test(m);
    console.log("---");
  }
}
main();