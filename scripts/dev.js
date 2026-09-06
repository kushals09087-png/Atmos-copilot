import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

console.log("\x1b[36m%s\x1b[0m", "\n========================================");
console.log("\x1b[1m\x1b[36m%s\x1b[0m", "       ☀️  ATMOS COPILOT  ☀️");
console.log("\x1b[90m%s\x1b[0m", "   AI Weather Intelligence Dashboard");
console.log("\x1b[36m%s\x1b[0m", "========================================\n");

function startProcess(name, command, cwd, color) {
  const proc = spawn(command, {
    cwd,
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" }
  });

  const prefix = `\x1b[${color}m[${name}]\x1b[0m `;

  proc.stdout.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) console.log(prefix + line);
    }
  });

  proc.stderr.on("data", (data) => {
    const lines = data.toString().split("\n");
    for (const line of lines) {
      if (line.trim()) console.error(prefix + line);
    }
  });

  proc.on("error", (err) => {
    console.error(prefix + `Failed to start: ${err.message}`);
  });

  return proc;
}

const backend = startProcess("Backend", "npm run dev", path.join(ROOT, "backend"), "35");
const frontend = startProcess("Frontend", "npm run dev", path.join(ROOT, "frontend"), "36");

function cleanup() {
  console.log("\n\x1b[33mShutting down Atmos Copilot services...\x1b[0m");
  try { backend.kill("SIGTERM"); } catch {}
  try { frontend.kill("SIGTERM"); } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
