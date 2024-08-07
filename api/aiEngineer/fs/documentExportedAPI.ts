// import Parser from "tree-sitter";
// import TypeScript from "tree-sitter-typescript";

// interface ExportedItem {
//   name: string;
//   kind: string;
//   documentation: string;
//   code: string;
// }

// type FileType = "ts" | "tsx";

// function getExportedItems(
//   fileContent: string,
//   fileType: FileType
// ): ExportedItem[] {
//   const parser = new Parser();

//   if (fileType === "tsx") {
//     parser.setLanguage(TypeScript.tsx);
//   } else if (fileType === "ts") {
//     parser.setLanguage(TypeScript.typescript);
//   } else return [];

//   const tree = parser.parse(fileContent);

//   const exportedItems: ExportedItem[] = [];

//   function traverseTree(node: Parser.SyntaxNode) {
//     if (node.type === "export_statement") {
//       const declaration = node.childForFieldName("declaration");
//       if (declaration) {
//         const item = parseExportedItem(declaration, fileContent);
//         if (item) {
//           exportedItems.push(item);
//         }
//       }
//     } else if (
//       node.type === "lexical_declaration" &&
//       node.parent?.type === "export_statement"
//     ) {
//       for (const declarator of node.children.filter(
//         (child: Parser.SyntaxNode) => child.type === "variable_declarator"
//       )) {
//         const item = parseExportedItem(declarator, fileContent);
//         if (item) {
//           exportedItems.push(item);
//         }
//       }
//     }

//     for (let child of node.children) {
//       traverseTree(child);
//     }
//   }

//   traverseTree(tree.rootNode);

//   return exportedItems;
// }

// function parseExportedItem(
//   node: Parser.SyntaxNode,
//   fileContent: string
// ): ExportedItem | null {
//   const name = node.childForFieldName("name");
//   if (!name) return null;

//   const kind = node.type;
//   const documentation = extractDocumentation(node);
//   let code = "";

//   switch (kind) {
//     case "interface_declaration":
//     case "type_alias_declaration":
//     case "enum_declaration":
//     case "namespace_declaration":
//       code = fileContent.substring(node.startIndex, node.endIndex);
//       break;
//     case "function_declaration":
//     case "method_definition":
//       code = extractFunctionSignature(node, fileContent);
//       break;
//     case "class_declaration":
//       code = extractClassSignature(node, fileContent);
//       break;
//     case "variable_declarator":
//       code = extractVariableDeclaration(node, fileContent);
//       break;
//     default:
//       code = fileContent.substring(node.startIndex, node.endIndex);
//   }

//   return {
//     name: name.text,
//     kind,
//     documentation,
//     code,
//   };
// }

// function extractDocumentation(node: Parser.SyntaxNode): string {
//   let documentation = "";
//   let currentNode = node.previousSibling;
//   while (
//     currentNode &&
//     (currentNode.type === "const" ||
//       currentNode.type === "export" ||
//       currentNode.type === "function" ||
//       currentNode.type === "let")
//   ) {
//     currentNode = currentNode.previousSibling;
//   }

//   while (currentNode && currentNode.type === "comment") {
//     console.log("🚀 | currentNode:", currentNode.text);
//     const commentText = currentNode.text
//       .replace(/^\/\*\*|\*\/$/g, "") // Remove /** and */ for block comments
//       .replace(/^\s*\/\/\s?/gm, "") // Remove // for line comments
//       .replace(/^\s*\*\s?/gm, "") // Remove leading asterisks
//       .trim();

//     documentation = commentText + (documentation ? "\n\n" + documentation : "");
//     currentNode = currentNode.previousSibling;
//   }

//   return documentation;
// }

// function extractFunctionSignature(
//   node: Parser.SyntaxNode,
//   fileContent: string
// ): string {
//   const nameNode = node.childForFieldName("name");
//   const typeParameters = node.childForFieldName("type_parameters");
//   const parameterList = node.childForFieldName("parameters");
//   const returnType = node.childForFieldName("return_type");

//   let signature = nameNode ? `function ${nameNode.text}` : "function";

//   if (typeParameters) {
//     signature += `<${fileContent.substring(
//       typeParameters.startIndex + 1,
//       typeParameters.endIndex - 1
//     )}>`;
//   }

//   signature += "(";

//   if (parameterList) {
//     signature += fileContent.substring(
//       parameterList.startIndex + 1,
//       parameterList.endIndex - 1
//     );
//   }

//   signature += ")";

//   if (returnType) {
//     signature += `: ${fileContent
//       .substring(returnType.startIndex + 1, returnType.endIndex)
//       .trim()}`;
//   }

//   return signature;
// }

// function extractClassSignature(
//   node: Parser.SyntaxNode,
//   fileContent: string
// ): string {
//   let signature = "class " + node.childForFieldName("name")?.text;

//   const typeParameters = node.childForFieldName("type_parameters");
//   if (typeParameters) {
//     signature += `<${fileContent.substring(
//       typeParameters.startIndex + 1,
//       typeParameters.endIndex - 1
//     )}>`;
//   }

//   const body = node.childForFieldName("body");
//   if (body) {
//     signature += " {\n";
//     for (const child of body.children) {
//       if (child.isNamed && !child.text.startsWith("private")) {
//         if (child.type === "method_definition") {
//           signature +=
//             "  " + extractFunctionSignature(child, fileContent) + ";\n";
//         } else if (child.type === "public_field_definition") {
//           signature +=
//             "  " +
//             fileContent.substring(child.startIndex, child.endIndex) +
//             ";\n";
//         }
//       }
//     }
//     signature += "}";
//   }

//   return signature;
// }

// function extractVariableDeclaration(
//   node: Parser.SyntaxNode,
//   fileContent: string
// ): string {
//   const nameNode = node.childForFieldName("name");
//   const typeNode = node.childForFieldName("type");
//   const valueNode = node.childForFieldName("value");

//   let declaration = `${nameNode?.text}`;

//   if (typeNode) {
//     declaration += `: ${fileContent
//       .substring(typeNode.startIndex, typeNode.endIndex)
//       .trim()}`;
//   }

//   if (valueNode) {
//     // For React functional components, we don't need to add the function signature
//     if (typeNode && typeNode.text.includes("React.FC")) {
//       return declaration; // Return early for React functional components
//     }

//     if (
//       valueNode.type === "string" ||
//       valueNode.type === "number" ||
//       valueNode.type === "true" ||
//       valueNode.type === "false" ||
//       valueNode.type === "null"
//     ) {
//       declaration += ` = ${fileContent.substring(
//         valueNode.startIndex,
//         valueNode.endIndex
//       )}`;
//     } else if (valueNode.type === "arrow_function") {
//       declaration += ` = ${extractFunctionSignature(valueNode, fileContent)}`;
//     } else if (valueNode.type === "function") {
//       declaration += ` = ${extractFunctionSignature(valueNode, fileContent)}`;
//     } else {
//       declaration += ` = ...`; // For complex expressions, just indicate that there's a value
//     }
//   }

//   return declaration;
// }

// function generateMarkdownDoc(items: ExportedItem[]): string {
//   let markdown = "```tsx\n";

//   for (const item of items) {
//     markdown += `**Kind:** ${item.kind}\n\n`;
//     if (item.documentation) {
//       markdown += `${item.documentation}\n\n`;
//     }

//     // Remove any extra colons that might appear
//     markdown += item.code.replace(/:\s*:/, ":");

//     markdown += "\n\n";
//   }
//   markdown += "```";
//   return markdown.trim();
// }

// export function documentExportedAPI(
//   fileContent: string,
//   filename: string
// ): string {
//   let fileType: FileType = "ts";
//   if (filename.endsWith(".tsx")) {
//     fileType = "tsx";
//   }
//   const exportedItems = getExportedItems(fileContent, fileType);

//   return generateMarkdownDoc(exportedItems);

// }
