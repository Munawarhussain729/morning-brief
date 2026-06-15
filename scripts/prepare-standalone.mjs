import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneRoot = path.join(root, ".next", "standalone");

copyIfExists(path.join(root, "public"), path.join(standaloneRoot, "public"));
copyIfExists(path.join(root, ".next", "static"), path.join(standaloneRoot, ".next", "static"));

function copyIfExists(source, destination) {
  if (!fs.existsSync(source)) return;
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
}
