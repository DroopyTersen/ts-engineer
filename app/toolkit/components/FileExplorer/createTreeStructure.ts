export type FSNode = {
  id: string;
  name: string;
  type: "folder" | "file";
  isExpanded: boolean;
  isSelected: boolean;
  children?: FSNode[];
  fullPath: string;
};

export function createTreeStructure(
  files: string[],
  selectedFiles: string[] = []
): FSNode[] {
  const root: FSNode[] = [];

  function addNode(
    parts: string[],
    currentLevel: FSNode[],
    depth: number,
    parentPath: string
  ): boolean {
    if (parts.length === 0) return false;
    const part = parts[0];
    const isFile = parts.length === 1;
    const fullPath = parentPath ? `${parentPath}/${part}` : part;

    let node = currentLevel.find((n) => n.name === part);
    let containsSelectedFile = false;

    if (!node) {
      containsSelectedFile = isFile && selectedFiles.includes(fullPath);
      node = {
        id: fullPath,
        name: part,
        type: isFile ? "file" : "folder",
        isExpanded: depth === 0 || containsSelectedFile,
        isSelected: isFile && selectedFiles.includes(fullPath),
        children: isFile ? undefined : [],
        fullPath: fullPath,
      };
      currentLevel.push(node);
    }
    if (!isFile) {
      const childContainsSelected = addNode(
        parts.slice(1),
        node.children as FSNode[],
        depth + 1,
        fullPath
      );
      if (childContainsSelected) {
        node.isExpanded = true;
        containsSelectedFile = true;
      }
    }
    return containsSelectedFile;
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

  let sortedNodes = sortNodes(root);
  return updateParentFolders(sortedNodes);
}

export function getSelectedFiles(tree: FSNode[]): string[] {
  const selectedFiles: string[] = [];

  function traverse(node: FSNode) {
    if (node.type === "file" && node.isSelected) {
      selectedFiles.push(node.fullPath);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  tree.forEach(traverse);
  return selectedFiles;
}

export const updateParentFolders = (data: FSNode[]): FSNode[] => {
  return data.map((node) => {
    if (node.type === "folder" && node.children) {
      const updatedChildren = updateParentFolders(node.children);
      const allChildrenSelected = updatedChildren.every(
        (child) => child.isSelected
      );
      return {
        ...node,
        isSelected: allChildrenSelected,
        children: updatedChildren,
      };
    }
    return node;
  });
};
