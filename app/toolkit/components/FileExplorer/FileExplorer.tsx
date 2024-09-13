import { useCallback, useMemo, useState } from "react";
import { Checkbox } from "~/shadcn/components/ui/checkbox";
import { Input } from "~/shadcn/components/ui/input";
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
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredTreeData = useMemo(() => {
    if (!searchQuery) return treeData;
    return filterTree(treeData, searchQuery.toLowerCase());
  }, [treeData, searchQuery]);

  let oneNodeIsSelected = getSelectedFiles(treeData).length > 0;
  return (
    <div className="text-sm relative">
      <div className="mb-4 flex items-center gap-4 px-2 pt-2 justify-between sticky top-6 bg-white z-10">
        <Checkbox
          checked={oneNodeIsSelected}
          className="w-5 h-5 rounded hover:bg-gray-200"
          onCheckedChange={() => {
            if (oneNodeIsSelected) {
              deselectAll();
            } else {
              selectAll();
            }
          }}
        />
        <div className="h-6 w-px bg-gray-300/40" />
        <Input
          type="search"
          placeholder="Filter files..."
          className="rounded-full"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <Tree
        nodes={filteredTreeData}
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

const filterTree = (nodes: FSNode[], query: string): FSNode[] => {
  return nodes.reduce((acc: FSNode[], node) => {
    if (node.fullPath.toLowerCase().includes(query)) {
      const filteredNode = { ...node };
      if (node.children) {
        filteredNode.children = filterTree(node.children, query);
      }
      filteredNode.isExpanded = true; // Expand matching nodes
      acc.push(filteredNode);
    } else if (node.children) {
      const filteredChildren = filterTree(node.children, query);
      if (filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren, isExpanded: true });
      }
    }
    return acc;
  }, []);
};
