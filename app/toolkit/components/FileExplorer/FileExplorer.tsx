import { useCallback, useState } from "react";
import { Button } from "~/shadcn/components/ui/button";
import {
  createTreeStructure,
  FSNode,
  getSelectedFiles,
  updateParentFolders,
} from "./createTreeStructure";
import { TreeItem } from "./TreeItem";

export function FileExplorer({
  files,
  selectedFiles = [],
  onSelection,
}: {
  files: string[];
  selectedFiles?: string[];
  onSelection: (selectedFiles: string[]) => void;
}) {
  const [treeData, setTreeData] = useState<FSNode[]>(() =>
    createTreeStructure(files, selectedFiles)
  );

  const toggleSelect = useCallback(
    (item: FSNode) => {
      setTreeData((prevData) => {
        const newData = updateTreeData(
          prevData,
          item.id,
          (node) => ({
            ...node,
            isSelected: !node.isSelected,
          }),
          item.type === "folder"
        );
        const updatedData = updateParentFolders(newData);
        onSelection(getSelectedFiles(updatedData));
        return updatedData;
      });
    },
    [onSelection]
  );

  const toggleExpanded = (item: FSNode) => {
    setTreeData((prevData) =>
      updateTreeData(prevData, item.id, (node) => ({
        ...node,
        isExpanded: !node.isExpanded,
      }))
    );
  };

  const selectAll = useCallback(() => {
    setTreeData((prevData) => {
      const updatedData = updateAllNodes(prevData, true);
      onSelection(getSelectedFiles(updatedData));
      return updatedData;
    });
  }, [onSelection]);

  const deselectAll = useCallback(() => {
    setTreeData((prevData) => {
      const updatedData = updateAllNodes(prevData, false);
      onSelection([]);
      return updatedData;
    });
  }, [onSelection]);

  return (
    <div className="text-sm">
      <div className="mb-4">
        <Button type="button" variant="ghost" onClick={selectAll}>
          Select All
        </Button>
        <Button type="button" variant="ghost" onClick={deselectAll}>
          Deselect All
        </Button>
      </div>
      <Tree
        nodes={treeData}
        onSelect={toggleSelect}
        onExpand={toggleExpanded}
      />
    </div>
  );
}

function Tree({
  nodes,
  onSelect,
  onExpand,
}: {
  nodes: FSNode[];
  onSelect: (node: FSNode) => void;
  onExpand: (node: FSNode) => void;
}) {
  return (
    <div className="grid gap-0">
      {nodes.map((item, index) => (
        <div key={item.id}>
          <TreeItem item={item} onSelect={onSelect} onFolderExpand={onExpand} />
          {item.type === "folder" && item.children && (
            <div
              className={`tree-item-children pl-4 ${
                item.isExpanded ? "block" : "hidden"
              }`}
            >
              <Tree
                nodes={item.children}
                onSelect={onSelect}
                onExpand={onExpand}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const updateTreeData = (
  data: FSNode[],
  id: string,
  updateFn: (node: FSNode) => FSNode,
  updateChildren: boolean = false
): FSNode[] => {
  return data.map((node) => {
    if (node.id === id) {
      console.log("updateTreeData", id, node.id, node.type);
      const updatedNode = updateFn(node);
      if (updateChildren && node.type === "folder") {
        return updateNodeAndChildren(updatedNode);
      }
      return updatedNode;
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, id, updateFn, updateChildren),
      };
    }
    return node;
  });
};

const updateNodeAndChildren = (node: FSNode): FSNode => {
  if (node.type === "folder" && node.children) {
    return {
      ...node,
      children: node.children.map((child) =>
        updateNodeAndChildren({
          ...child,
          isSelected: node.isSelected,
        })
      ),
    };
  }
  return node;
};

const updateAllNodes = (data: FSNode[], isSelected: boolean): FSNode[] => {
  return data.map((node) => ({
    ...node,
    isSelected,
    children: node.children
      ? updateAllNodes(node.children, isSelected)
      : undefined,
  }));
};
