import Parser from "tree-sitter";

// Supported extensions
export type Extension = ".js" | ".ts" | ".java" | ".md" | ".html";

export type Language =
  | "JavaScript"
  | "TypeScript"
  | "Java"
  | "Markdown"
  | "HTML"
  | "Unknown";

export interface Node {
  name: string;
  type: string;
  position?: {
    start: NodePosition;
    end: NodePosition;
  };
  filePath?: string;
  text: string;
  language: Language;
  children: Node[];
}

export interface NodePosition {
  column: number;
  row: number;
}

export interface AnchorNode extends Node {
  type: "a_tag" | "pre_tag";
  node: Parser.SyntaxNode;
  codeAnchor: string;
}

export interface CodeNode extends Node {
  type: "class" | "method" | "function" | "arrow_function" | "arrow_method";
}

export interface FileNode extends Node {
  type: "file";
  extension: Extension;
  filePath: string;
}

export interface CodeIndex {
  [x: string]: Node;
}

export interface DocIndex {
  [x: string]: CodeIndex;
}
