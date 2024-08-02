export const getFileContent = (filePath: string) => {
  return Bun.file(filePath).text;
};

export async function filesToMarkdown(filePaths: string[]) {
  let allFileContents = await Promise.all(
    filePaths.map((path, index) => {
      let content = getFileContent(path);
      let fileExtension = path.split(".").pop();
      return `${filePaths[index]}
    
\`\`\`${fileExtension}
${content}
\`\`\`
`;
    })
  );
  return allFileContents.join("\n\n");
}
