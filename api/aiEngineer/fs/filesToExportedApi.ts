// import { documentExportedAPI } from "./documentExportedAPI";
// import { processFileContents } from "./getFileContent";

// export async function filesToExportedApi(
//   filePaths: string[],
//   projectPath = ""
// ) {
//   let allExportedApis = await processFileContents(
//     filePaths,
//     projectPath,
//     (filepath, content) => {
//       let exportedApi = documentExportedAPI(content, filepath);
//       return `${filepath}\n\n${exportedApi}`;
//     }
//   );

//   return `
// ## Exported APIs

// ${allExportedApis.join("\n\n")}`.trim();
// }
