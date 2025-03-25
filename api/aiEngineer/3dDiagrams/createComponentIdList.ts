import * as fs from "fs/promises";
import { DIAGRAM_COMPONENTS } from "./3D_DIAGRAM_COMPONENTS";

const componentSections = Object.keys(DIAGRAM_COMPONENTS);
type Section = keyof typeof DIAGRAM_COMPONENTS;
console.log(componentSections);

const componentIdList = componentSections.flatMap((section) => {
  return Object.values(DIAGRAM_COMPONENTS[section as Section]?.components || {})
    .map((component) => {
      return {
        id: component.id,
        name: component.name,
      };
    })
    .filter((c) => !c.name.includes("GCC") && !c.name.includes("AWS"))
    .filter((c) => !c.id.includes("gcc") && !c.id.includes("aws"))
    .map((c) => c.id);
});
fs.writeFile(
  "componentIdList.ts",
  `export const ALL_DIAGRAM_COMPONENTS = ${JSON.stringify(
    componentIdList,
    null,
    2
  )}`
);
