/** Loads .env files for CLI scripts, mirroring Next.js precedence. */
for (const file of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(file);
  } catch {
    // optional file
  }
}
