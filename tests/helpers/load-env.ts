import path from "node:path";
import dotenv from "dotenv";

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(process.cwd(), ".env") });
}
