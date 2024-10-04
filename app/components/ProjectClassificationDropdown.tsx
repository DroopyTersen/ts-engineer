import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/shadcn/components/ui/select";

interface ProjectClassificationDropdownProps {
  name: string;
  defaultValue?: string;
}

export const ProjectClassificationDropdown: React.FC<
  ProjectClassificationDropdownProps
> = ({ name, defaultValue = "private" }) => {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select classification" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="work">Work</SelectItem>
        <SelectItem value="private">Private</SelectItem>
        <SelectItem value="public">Public</SelectItem>
      </SelectContent>
    </Select>
  );
};
