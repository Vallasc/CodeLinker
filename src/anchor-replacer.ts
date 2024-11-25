import { CODE_LINK_ATTRIBUTE } from "./config";
import { AnchorNode, CodeIndex, DocIndex, Language, Node } from "./types";
import { readFileAsString, writeFile } from "./utils/file-utils";
import jsdom from "jsdom";

const normalizeNewLines = (text: string) => text.replace(/\r\n|\r/g, "\n");
const { JSDOM } = jsdom;

const languageAliases: { [key in Language]: string } = {
  JavaScript: "javascript",
  TypeScript: "typescript",
  Java: "java",
  HTML: "html",
  Markdown: "markdown",
  Unknown: "",
};

export const replace = async (codeIndex: CodeIndex, docIndex: DocIndex) => {
  //console.log(codeIndex);
  const filePaths = Object.keys(docIndex);
  for (const file of filePaths) {
    const content = normalizeNewLines(await readFileAsString(file));
    const anchors = (Object.values(docIndex[file]) as Node[]).filter(
      (o) => o.type === "a_tag" || o.type === "pre_tag"
    ) as AnchorNode[];
    //console.log(docIndex);
    //console.log(anchors);
    const processedContent = processAnchors(content, anchors, (n) =>
      replaceTags(n, codeIndex)
    );
    await writeFile(file, processedContent);
  }
};

const replaceTags = (anchor: AnchorNode, codeIndex: CodeIndex): string => {
  const dom = new JSDOM(anchor.node.text);
  let element = dom.window.document.querySelector("a, pre")!;
  const codeLink = element.getAttribute(CODE_LINK_ATTRIBUTE)!;
  const codeNode = codeIndex[codeLink];
  //console.log(codeNode)
  if (!codeNode)
    throw new Error(
      `CodeLink [${codeLink}] not found at ${anchor.filePath} line ${
        anchor.position!.start.row + 1
      } column ${anchor.position!.start.column + 1}`
    );
  const href = buildUrl(codeNode);
  element.setAttribute("href", href);
  if (anchor.type === "pre_tag") {
    const lang = languageAliases[codeNode.language];
    element.innerHTML = `\n${codeNode.text}\n`;
    if (lang && lang !== "Unknown") {
      element.innerHTML = `<code class="language-${lang}">${element.innerHTML}</code>`;
    }
  }
  return element.outerHTML;
};

const processAnchors = (
  content: string,
  anchors: AnchorNode[],
  processFun: (node: AnchorNode) => string
) => {
  let currentRow = 0;
  let currentCol = 0;
  let lastEndIndex = 0;
  let charIndex = 0;
  let anchorIndex = 0;
  const result: string[] = [];

  const anchorNodes = anchors.sort((a, b) => {
    if (a.position!.start.row !== b.position!.start.row) {
      return a.position!.start.row - b.position!.start.row;
    }
    return a.position!.start.column - b.position!.start.column;
  });

  while (charIndex < content.length) {
    const char = content[charIndex];
    const anchor = anchorNodes[anchorIndex];
    // Char in range of the node
    if (
      anchor &&
      anchor.position!.start.row == currentRow &&
      anchor.position!.start.column == currentCol
    ) {
      result.push(content.slice(lastEndIndex, charIndex));
    }
    if (
      anchor &&
      anchor.position!.end.row == currentRow &&
      anchor.position!.end.column == currentCol
    ) {
      result.push(processFun(anchor));
      lastEndIndex = charIndex;
      anchorIndex++;
    }

    // Move to the next row on encountering a newline (\n, or \r\n)
    if (char === "\n") {
      currentRow++;
      currentCol = 0;
    } else {
      currentCol++;
    }
    charIndex++;
  }
  result.push(content.slice(lastEndIndex, charIndex));
  return result.join("");
};

// <filepath>#L<n>-L<m>
const buildUrl = (node: Node) => {
  if (node.type === "file") return node.filePath!;
  else
    return (
      `${node.filePath}#L${node.position!.start.row + 1}` +
      (node.position!.start.row !== node.position!.end.row
        ? `-L${node.position!.end.row + 1}`
        : "")
    );
};
