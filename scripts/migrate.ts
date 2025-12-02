import { readFileSync, mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { spawn } from "child_process";

async function runCommand(
  command: string,
  args: string[]
): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const process = spawn(command, args, {
      stdio: "pipe",
      shell: true,
    });

    let output = "";
    let errorOutput = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    process.on("close", (code) => {
      resolve({
        success: code === 0,
        output: output || errorOutput,
      });
    });
  });
}

async function migrate() {
  const schemaPath = join(process.cwd(), "supabase-schema.sql");

  console.log("🔍 Checking for Supabase CLI...");
  const cliCheck = await runCommand("bunx", ["supabase", "--version"]);

  if (!cliCheck.success) {
    console.log("❌ Failed to run Supabase CLI via bunx");
    console.log("\n📝 Or use manual migration:");
    console.log(`   1. Copy contents of ${schemaPath}`);
    console.log("   2. Go to Supabase Dashboard > SQL Editor");
    console.log("   3. Paste and execute");
    process.exit(1);
  }

  console.log("✅ Supabase CLI detected:", cliCheck.output.trim());

  // Check if project is linked
  console.log("🔍 Checking project status...");
  const statusCheck = await runCommand("bunx", ["supabase", "status"]);

  if (!statusCheck.success || statusCheck.output.includes("not linked")) {
    console.log("⚠️  Project not linked to Supabase");
    console.log("\n📝 To link your project:");
    console.log(
      "   1. Get your project ref from Supabase Dashboard > Settings > General"
    );
    console.log("   2. Run: bunx supabase link --project-ref YOUR_PROJECT_REF");
    console.log("   3. Enter your database password when prompted");
    process.exit(1);
  }

  console.log("📤 Creating migration file...");

  try {
    const schema = readFileSync(schemaPath, "utf-8");

    // Create migrations directory if it doesn't exist
    const migrationsDir = join(process.cwd(), "supabase", "migrations");
    if (!existsSync(migrationsDir)) {
      mkdirSync(migrationsDir, { recursive: true });
    }

    // Create migration file with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const migrationFile = join(migrationsDir, `${timestamp}_cms_schema.sql`);

    writeFileSync(migrationFile, schema);
    console.log(`✅ Created migration file: ${migrationFile}`);

    // Push the migration using Supabase CLI
    console.log("📤 Pushing schema to Supabase...");
    const pushResult = await runCommand("bunx", ["supabase", "db", "push"]);

    if (pushResult.success) {
      console.log("✅ Schema pushed successfully!");
      console.log(pushResult.output);
    } else {
      console.error("❌ Failed to push schema:");
      console.error(pushResult.output);
      console.log("\n📝 Alternative: Run SQL manually");
      console.log(`   1. Copy contents of ${schemaPath}`);
      console.log("   2. Go to Supabase Dashboard > SQL Editor");
      console.log("   3. Paste and execute");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
}

migrate().catch((error) => {
  console.error("❌ Migration failed:", error);
  process.exit(1);
});
