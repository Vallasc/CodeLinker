import Html from "tree-sitter-html";
import { AnchorNode, Node } from "../types";
import { GenericParser } from "./generic";
import Parser from "tree-sitter";
import { CODE_LINK_ATTRIBUTE } from "../config";

export class HTMLParser extends GenericParser {

  constructor() {
    super();
    this.parser.setLanguage(Html);
  }

  override buildTree(code: string): Node[]{
    return super.buildTreeWithCondition(code, HTMLParser.nodeBuilder);
  }

  static nodeBuilder(node: Parser.SyntaxNode): AnchorNode | null {
    if (node.type !== "element" || !HTMLParser.hasCodeAttribute(node))
      return null;
    const startTag = node.firstChild;
    const endTag = node.lastChild;
    const tagName = startTag?.firstNamedChild?.text
    let type : "a_tag" | "pre_tag";
    switch(tagName){
      case "a":
        type = "a_tag";
        break;
      case "pre":
        type = "pre_tag";
        break;
      default:
        return null;
    }
    return {
      name: "CodeLink",
      type,
      language: "HTML",
      text: node.text,
      node,
      codeAnchor: "",
      position: {
        start: {
          row: node.startPosition.row,
          column: node.startPosition.column,
        },
        end: {
          row: node.endPosition.row,
          column: node.endPosition.column,
        },
      },
      children: [] // dummy
    }
  }

  private static hasCodeAttribute = (node: Parser.SyntaxNode) => node.firstNamedChild?.namedChildren.some(
    (n) => n.type === "attribute" && n.firstNamedChild?.text === CODE_LINK_ATTRIBUTE
  );
}
