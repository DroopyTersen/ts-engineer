import { FileEdit, FileEditOperation } from "./applyFileEdit.schema";

export function applyFileEdit(edit: FileEdit, fileContent: string): string {
  let content = fileContent;

  for (const operation of edit.operations) {
    content = applyOperation(operation, content);
  }

  return content;
}

function applyOperation(operation: FileEditOperation, content: string): string {
  const regex = new RegExp(operation.pattern, "gm");

  switch (operation.type) {
    case "insert":
      switch (operation.position) {
        case "before":
          if (operation.pattern === "^") {
            return operation.content + content;
          }
          return content.replace(regex, (match) => operation.content + match);
        case "after":
          if (operation.pattern === "$") {
            return content + operation.content;
          }
          return content.replace(regex, (match) => match + operation.content);
        case "start":
          return operation.content + content;
        case "end":
          return content + operation.content;
      }

    case "replace":
      return content.replace(regex, () => operation.content);

    case "delete":
      return content.replace(regex, "");

    default:
      throw new Error(
        `Unsupported operation type: ${(operation as FileEditOperation).type}`
      );
  }
}
