import { copyFile, mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";

await rm("dist/client", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });

for (const entry of await readdir("dist")) {
  if (entry === "client") continue;
  await rename(`dist/${entry}`, `dist/client/${entry}`);
}

await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });

await writeFile(
  "dist/server/index.js",
  `export default {
  async fetch(request, env) {
    if (!env.ASSETS) {
      return new Response("Static asset binding is unavailable", { status: 503 });
    }
    return env.ASSETS.fetch(request);
  },
};
`,
);

await copyFile(".openai/hosting.json", "dist/.openai/hosting.json");
