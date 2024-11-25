#!/usr/bin/env node

import * as fs from "fs";
import { argv } from "node:process";
import { generateCodeIndex, generateCodeTree } from "./code-indexer";
import { OUT_FILE } from "./config";
import { CodeIndex, DocIndex, FileNode, Node } from "./types";
import { replace } from "./anchor-replacer";
import { writeFile } from "./utils/file-utils";

const basePath = argv[2] ?? ".";

const main = async () => {
  const tree: FileNode[] = await generateCodeTree(basePath);
  let codeIndex: CodeIndex = {};
  let docIndex: DocIndex = {};
  tree.forEach((fileNode) => {
    console.log(fileNode.filePath);
    if (fileNode.extension !== ".md")
      codeIndex = { ...codeIndex, ...generateCodeIndex(fileNode) };
    else
      docIndex[fileNode.filePath] = {
        ...docIndex[fileNode.filePath],
        ...generateCodeIndex(fileNode),
      };
  });
  await writeFile(OUT_FILE, JSON.stringify(codeIndex, null, 2));
  replace(codeIndex, docIndex);
};

main();
