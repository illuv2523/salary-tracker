import { cpSync, mkdirSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, "../..")
const dest = resolve(here, "../public/app")

mkdirSync(dest, { recursive: true })
for (const file of ["index.html", "style.css", "script.js"]) {
  cpSync(resolve(repoRoot, file), resolve(dest, file))
}
