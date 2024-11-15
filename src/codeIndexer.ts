import * as fs from "node:fs";
import * as path from "node:path";
import { Node } from "./types";
import { TypeScriptParser } from "./parsers/typescript";
import { JavaParser } from "./parsers/java";
import { readPath } from "./utils/file-utils";
import { GenericParser } from "./parsers/generic";
import { JavaScriptParser } from "./parsers/javascript";

type Extension = ".js" | ".ts" | ".java"; // Supported extensions

const parsers: { [key in Extension]: GenericParser } = {
  ".js": new JavaScriptParser(),
  ".ts": new TypeScriptParser(),
  ".java": new JavaParser(),
};

export async function generateCodeIndex(
  workspacePath: string
): Promise<Node[]> {
  const files = await readPath(workspacePath, Object.keys(parsers));
  console.log(files)
  return files.map((filePath) => {
    const code = fs.readFileSync(filePath, "utf-8");
    const ext = path.extname(filePath) as Extension;
    const parser = parsers[ext]
    return {
      name: path.basename(filePath),
      type: "file",
      filePath,
      children: parser.buildTree(code),
    };
  });
}
