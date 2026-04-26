import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import type { Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const basePort = Number(process.env.PORT ?? 3000);

  const createVite = async () => {
    return createViteServer({
      // In middleware mode we don't need Vite's HMR websocket server to bind a port.
      // Disabling HMR avoids frequent EADDRINUSE conflicts (e.g. port 24678).
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
  };

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createVite();
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const listenWithFallback = (startPort: number, attempts: number) =>
    new Promise<Server>((resolve, reject) => {
      let currentPort = startPort;

      const tryListen = () => {
        const server = app
          .listen(currentPort, "0.0.0.0", () => {
            console.log(`Server running on http://localhost:${currentPort}`);
            resolve(server);
          })
          .on("error", (err: any) => {
            if (err?.code === "EADDRINUSE" && attempts > 0) {
              attempts -= 1;
              currentPort += 1;
              tryListen();
              return;
            }
            reject(err);
          });
      };

      tryListen();
    });

  await listenWithFallback(basePort, 20);
}

startServer();
