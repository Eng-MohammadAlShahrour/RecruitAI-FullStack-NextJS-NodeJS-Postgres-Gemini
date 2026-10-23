import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Key prefix:", key ? key.slice(0, 20) : "MISSING");
  console.log("Model:", process.env.LLM_MODEL);

  const client = new GoogleGenerativeAI(key!);
  const model = client.getGenerativeModel({
    model: process.env.LLM_MODEL ?? "gemini-2.0-flash",
  });

  console.log("Calling Gemini...");
  const res = await model.generateContent("Say hi in JSON: {\"msg\":\"hi\"}");
  console.log("Response:", res.response.text());
}

main().catch((e) => {
  console.error("FULL ERROR:");
  console.error(e);
  process.exit(1);
});