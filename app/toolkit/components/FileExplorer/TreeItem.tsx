import { Link } from "@remix-run/react";
import { BsFolderFill as FolderIcon } from "react-icons/bs";
import { ChevronDownIcon, ChevronRightIcon } from "~/shadcn/components/icons";
import { Button } from "~/shadcn/components/ui/button";
import { Checkbox } from "~/shadcn/components/ui/checkbox";
import { FSNode } from "./createTreeStructure";

export const TreeItem = ({
  item,
  onSelect,
  onFolderExpand,
}: {
  item: FSNode;
  onSelect: (item: FSNode) => void;
  onFolderExpand: (item: FSNode) => void;
}) => {
  return (
    <div
      className={`flex items-center gap-2 px-2 py-1 h-9 ${
        item.isSelected ? "bg-gray-100 text-accent-foreground" : ""
      }`}
    >
      {/* <LevelIndicator level={level} /> */}
      <Checkbox
        checked={item.isSelected}
        className="w-5 h-5 rounded hover:bg-gray-200 mr-2"
        onCheckedChange={() => onSelect(item)}
      />
      {item.type === "folder" ? (
        <FolderContent item={item} onFolderExpand={onFolderExpand} />
      ) : (
        <FileContent item={item} />
      )}
    </div>
  );
};

const FolderContent = ({
  item,
  onFolderExpand,
}: {
  item: FSNode;
  onFolderExpand: (item: FSNode) => void;
}) => (
  <>
    <FolderIcon className="w-4 h-4 opacity-30 text-amber-500" />
    <span>{item.name}</span>
    <Button
      variant="ghost"
      size="icon"
      className="w-8 h-8 hover:bg-gray-200"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onFolderExpand(item);
      }}
    >
      {item.isExpanded ? (
        <ChevronDownIcon className="w-4 h-4" />
      ) : (
        <ChevronRightIcon className="w-4 h-4" />
      )}
    </Button>
  </>
);

const FileContent = ({ item }: { item: FSNode }) => (
  <>
    {/* <FileIcon className="w-0 h-4 opacity-0" /> */}
    <Link to="" className="pl-0 hover:underline">
      {item.name}
    </Link>
  </>
);
