import Parser from "tree-sitter";
import { Node } from "../types";

type Condition = (node: Parser.SyntaxNode) => Node | null;

export abstract class GenericParser {
  protected parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  abstract buildTree(code: string): Node[];

  buildTreeWithCondition(code: string, condition: Condition): Node[] {
    const parsed = this.parser.parse(code);
    return this.collectNodes(parsed.rootNode, condition);
  }

  private collectNodes(node: Parser.SyntaxNode, condition: Condition): Node[] {
    const children = node.namedChildren.flatMap((child) =>
      this.collectNodes(child, condition)
    );
    const processed = condition(node);
    if(processed){
      processed.children = children;
      return [processed];
    } else {
      return children;
    }
  }
}
