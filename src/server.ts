import { buildApp } from "./app.js";
import { env } from "./config/env.js";

async function startServer(): Promise<void> {
  const app = buildApp();

  try {
    await app.listen({
      port: env.PORT,
      host: "0.0.0.0",
    });

    console.log(`HTTP server listening on 0.0.0.0:${env.PORT}`);
  } catch (error) {
    console.error("Failed to start HTTP server", error);
    process.exit(1);
  }
}

void startServer();
