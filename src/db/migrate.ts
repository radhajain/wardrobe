import { execSync } from "child_process";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  console.log("Running drizzle-kit push...");

  try {
    execSync("npx drizzle-kit push --force", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: databaseUrl },
    });
    console.log("Database schema sync completed successfully");
  } catch (error) {
    console.error("Schema sync failed:", error);
    process.exit(1);
  }
}

runMigrations();
