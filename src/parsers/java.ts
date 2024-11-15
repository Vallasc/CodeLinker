import Java from "tree-sitter-java";
import { Node } from "../types";
import { GenericParser } from "./generic";
import Parser from "tree-sitter";

export class JavaParser extends GenericParser {

  constructor() {
    super();
    this.parser.setLanguage(Java);
  }

  override buildTree(code: string): Node[]{
    return super.buildTreeWithCondition(code, JavaParser.nodeBuilder);
  }

  static nodeBuilder(node: Parser.SyntaxNode): Node | null {
    if (node.type !== "class_declaration" && node.type !== "method_declaration")
      return null;
    const name = node.childForFieldName("name")?.text ?? "UnknownName"
    const type = node.type === "class_declaration" ? "class" : "method";
    return {
      name,
      type,
      position: {
        start: {
          row: node.startPosition.row + 1,
          column: node.startPosition.column + 1,
        },
        end: {
          row: node.endPosition.row + 1,
          column: node.endPosition.column + 1,
        },
      },
    }
  }
}
