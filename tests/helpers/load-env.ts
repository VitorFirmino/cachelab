import path from "node:path";
import dotenv from "dotenv";

export default async function globalSetup() {
  // Load `.env` for the Playwright test runner process (not the Next.js server process).
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}

