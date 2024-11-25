import * as fs from "node:fs";
import * as path from "node:path";
import { Extension, FileNode, Node } from "./types";
import { TypeScriptParser } from "./parsers/typescript";
import { JavaParser } from "./parsers/java";
import { filePathToExtension, filePathToLanguage, readPath } from "./utils/file-utils";
import { GenericParser } from "./parsers/generic";
import { JavaScriptParser } from "./parsers/javascript";
import { HTMLParser } from "./parsers/html";

const parsers: { [key in Extension]: GenericParser } = {
  ".js": new JavaScriptParser(),
  ".ts": new TypeScriptParser(),
  ".java": new JavaParser(),
  ".md": new HTMLParser(),
  ".html": new HTMLParser(),
};

export const generateCodeTree = async (
  workspacePath: string
): Promise<FileNode[]> => {
  const files = await readPath(workspacePath, Object.keys(parsers));
  return files.map((filePath) => {
    const code = fs.readFileSync(filePath, "utf-8");
    const extension = filePathToExtension(filePath);
    const parser = parsers[extension];
    const language = filePathToLanguage(filePath);
    return {
      name: path.basename(filePath),
      type: "file",
      language,
      text: code,
      extension,
      filePath,
      children: parser.buildTree(code),
    };
  });
};

export const generateCodeIndex = (
  codeTree: Node,
  parent: Node | null = null,
  nodeId: string = "",
  filePath: string = ""
) => {
  let index: { [key in string]: Node } = {};
  const divider = parent && parent.type === "file" ? "::" : ".";
  switch (codeTree.type) {
    case "file":
      filePath = (codeTree as FileNode).filePath;
      nodeId = filePath;
      break;
    case "class":
    case "method":
    case "arrow_method":
    case "function":
    case "arrow_function":
      nodeId = nodeId + divider + codeTree.name;
      break;
    case "pre_tag":
    case "a_tag":
      {
        const start = `${codeTree.position?.start.row}:${codeTree.position?.start.column}`;
        const end = `${codeTree.position?.end.row}:${codeTree.position?.end.column}`;
        const position = `#${start}-${end}`;
        nodeId = nodeId + divider + codeTree.name + position;
      }
      break;
  }
  index[nodeId] = {
    ...codeTree,
    filePath
  }
  codeTree.children.forEach((node) => {
    index = { ...index, ...generateCodeIndex(node, codeTree, nodeId, filePath) };
  });
  return index;
};
