import Javascript from "tree-sitter-javascript";
import { Node } from "../types";
import { GenericParser } from "./generic";
import Parser from "tree-sitter";

export class JavaScriptParser extends GenericParser {
  constructor() {
    super();
    this.parser.setLanguage(Javascript);
  }

  override buildTree(code: string): Node[] {
    return super.buildTreeWithCondition(code, JavaScriptParser.nodeBuilder);
  }

  static nodeBuilder(node: Parser.SyntaxNode): Node | null {
    let name = "-",
    type = "-";
    switch (node.type) {
      case "function_declaration":
        name = node.childForFieldName("name")?.text ?? "UnknownFunction";
        type = "function";
        break;
      case "lexical_declaration":
        {
          // Arrow function definition
          const firstChild = node.firstNamedChild;
          if (
            firstChild &&
            firstChild.type === "variable_declarator" &&
            firstChild.namedChild(0)?.type === "identifier" &&
            firstChild.namedChild(1)?.type === "arrow_function"
          ) {
            name = firstChild.namedChild(0)?.text ?? "UnknownFunction";
            type = "arrow_function";
          } else {
            return null;
          }
        }
        break;
      case "class_declaration":
        name = node.childForFieldName("name")?.text ?? "UnknownClass"
        type = "class";
        break;
      case "method_definition":
        name = node.childForFieldName("name")?.text ?? "UnknownMethod"
        type = "method";
        break;
      case "field_definition":
          // Arrow method definition
          if(node.namedChild(0)?.type === "property_identifier" &&
          node.namedChild(1)?.type === "arrow_function"
        ){
          name = node.namedChild(0)?.text ?? "UnknownMethod";
          type = "arrow_method";
        } else {
          return null;
        }
        break;
      default:
        return null;  
    }
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
