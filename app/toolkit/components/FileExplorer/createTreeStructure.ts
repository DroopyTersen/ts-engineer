export type FSNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  isExpanded: boolean;
  isSelected: boolean;
  children?: FSNode[];
  fullPath: string;
};

export function createTreeStructure(files: string[]): FSNode[] {
  const root: FSNode[] = [];

  function addNode(
    parts: string[],
    currentLevel: FSNode[],
    depth: number,
    parentPath: string
  ): void {
    if (parts.length === 0) return;
    const part = parts[0];
    const isFile = parts.length === 1;
    const fullPath = parentPath ? `${parentPath}/${part}` : part;

    let node = currentLevel.find((n) => n.name === part);

    if (!node) {
      node = {
        id: fullPath,
        name: part,
        type: isFile ? "file" : "folder",
        isExpanded: depth === 0, // Only expand first level folders
        isSelected: true,
        children: isFile ? undefined : [],
        fullPath: fullPath,
      };
      currentLevel.push(node);
    }
    if (!isFile) {
      addNode(parts.slice(1), node.children as FSNode[], depth + 1, fullPath);
    }
  }

  files.forEach((filePath) => {
    addNode(filePath.split("/"), root, 0, "");
  });

  // Sort function to put folders first, then files
  const sortNodes = (nodes: FSNode[]): FSNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      })
      .map((node) => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined,
      }));
  };

  return sortNodes(root);
}

export function getSelectedFiles(tree: FSNode[]): string[] {
  const selectedFiles: string[] = [];

  function traverse(node: FSNode) {
    if (node.type === "file" && node.isSelected) {
      selectedFiles.push(node.id);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  tree.forEach(traverse);
  return selectedFiles;
}
