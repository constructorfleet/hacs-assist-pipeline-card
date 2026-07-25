import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const tag = process.env.GITHUB_REF_NAME ?? process.argv[2];
const expected = `v${packageJson.version}`;

if (!tag) {
  console.error("No tag was provided. Set GITHUB_REF_NAME or pass a tag.");
  process.exit(1);
}

if (tag !== expected) {
  console.error(`Release tag ${tag} does not match package version ${expected}.`);
  process.exit(1);
}

console.log(`Release tag ${tag} matches package version ${packageJson.version}.`);
