import TypeScript from "tree-sitter-typescript";
import { CodeNode, Node } from "../types";
import { GenericParser } from "./generic";
import Parser from "tree-sitter";
import { JavaScriptParser } from "./javascript";

export class TypeScriptParser extends GenericParser {
  constructor() {
    super();
    this.parser.setLanguage(TypeScript.typescript);
  }

  override buildTree(code: string): Node[] {
    return super.buildTreeWithCondition(code, TypeScriptParser.nodeBuilder);
  }

  static nodeBuilder(node: Parser.SyntaxNode): CodeNode | null {
    const codeNode = JavaScriptParser.nodeBuilder(node);
    if(!codeNode)
      return null;
    return {
      ...codeNode,
      language: "TypeScript"
    }
  }
}
