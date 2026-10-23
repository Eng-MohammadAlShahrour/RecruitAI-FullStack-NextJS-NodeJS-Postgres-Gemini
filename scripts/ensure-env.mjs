import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
const examplePath = path.resolve(process.cwd(), ".env.example");

if (fs.existsSync(envPath)) {
  console.log("✅ .env.local already exists — leaving it alone");
  process.exit(0);
}

// Try to copy from .env.example first
if (fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log("✅ Created .env.local from .env.example");

  // If GEMINI_API_KEY is set in shell, inject it
  if (process.env.GEMINI_API_KEY) {
    let content = fs.readFileSync(envPath, "utf8");
    content = content.replace(
      /GEMINI_API_KEY=.*/,
      `GEMINI_API_KEY=${process.env.GEMINI_API_KEY}`
    );
    fs.writeFileSync(envPath, content);
    console.log("✅ Injected GEMINI_API_KEY from shell environment");
  } else {
    console.log("");
    console.log("⚠️  GEMINI_API_KEY not set in shell.");
    console.log("   Edit .env.local and replace the placeholder with your key:");
    console.log("   GEMINI_API_KEY=AIza...");
    console.log("");
  }
  process.exit(0);
}

console.error("❌ Cannot create .env.local — .env.example not found.");
process.exit(1);