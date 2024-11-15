export interface AnchorNode extends Node {
  type: "a_tag";
  node: string;
}

export interface CodeNode extends Node {
  type: "class" | "method" | "function" | "arrow_function" | "arrow_method";
}

export interface Node {
  name: string;
  type: string;
  filePath?: string;
  position?: {
    start: NodePosition;
    end: NodePosition;
  };
  children?: Node[];
}

export interface NodePosition {
  column: number;
  row: number;
}
