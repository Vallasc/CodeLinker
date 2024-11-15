#!/usr/bin/env node

import * as fs from "fs";
import { argv } from 'node:process';
import { generateCodeIndex } from "./codeIndexer";
import { OUT_FILE } from "./config";

const basePath = argv[2] ?? ".";

const main = async () => {
  const index = await generateCodeIndex(basePath);
  const jsonData = JSON.stringify(index, null, 2);

  fs.writeFile(OUT_FILE, jsonData, (err) => {
    if (err) {
      console.error("Error writing to file", err);
    } else {
      console.log(`File ${OUT_FILE} has been written successfully.`);
    }
  });
}

main();
