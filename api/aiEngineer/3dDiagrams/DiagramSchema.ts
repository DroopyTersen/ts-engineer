import { z } from "zod";

// Basic component types (you can expand this list as needed)
const ComponentType = z.string().regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z0-9.-]+$/);

// Define possible position types
const PositionType = z.enum(["auto", "relative", "absolute"]);

// Define possible label styles
const LabelStyle = z.enum(["block", "inline"]);

// Define possible line dash styles
const LineDash = z.enum(["solid", "dashed", "dotted"]);

// Define possible label positions
const LabelPosition = z.enum(["top", "bottom"]);

// Define possible label alignments
const LabelAlign = z.enum(["left", "center", "right"]);

// Define possible label placement on line
const LabelPlacementOnLine = z.enum(["above", "on", "below"]);

// Define possible position points
const PositionPoint = z.enum(["left", "middle", "right", "top", "bottom"]);

// Define common styling properties for both components and groups
const StylingProperties = z
  .object({
    opacity: z.number().min(0).max(1).optional(),
    rotation: z.number().optional(),
  })
  .partial();

// Define component-specific properties
const ComponentSchema = z
  .object({
    type: z.literal("component"),
    componentType: ComponentType,
    groups: z.array(z.string()).optional().default([]),
    connections: z.array(z.string()).optional().default([]),
    arrowsTo: z.union([z.literal("all"), z.array(z.string())]).optional(),
    label: z.string().optional(),
    tier: z.number().int().optional(),

    // Position properties
    positionType: PositionType.optional().default("auto"),
    positionRelativeTo: z.string().optional(),
    positionX: z.number().optional(),
    positionY: z.number().optional(),
    positionPointX: PositionPoint.optional(),
    positionPointY: PositionPoint.optional(),

    // Styling properties (for generic components)
    backgroundColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    primaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    secondaryColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    icon: z.union([z.string(), z.null()]).optional(),
    iconColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    imagePath: z.string().optional(),
    imageSize: z.number().min(0.001).max(1).optional(),

    // Metadata properties and display
    showMetaData: z.boolean().optional().default(false),
    showOnCanvas: z
      .union([z.literal("all"), z.string()])
      .optional()
      .default("all"),
    showInTooltip: z
      .union([z.literal("all"), z.string()])
      .optional()
      .default("all"),
    showMetaDataKeys: z.boolean().optional().default(true),
    metaDataFontSize: z.number().optional().default(0.25),
    metaDataTextAlign: z
      .enum(["left", "center", "right"])
      .optional()
      .default("center"),
  })
  .and(StylingProperties);

// Define group-specific properties
const GroupSchema = z
  .object({
    type: z.literal("group"),
    label: z.string().optional(),
    labelStyle: LabelStyle.optional().default("block"),
    lineColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    lineWidth: z.number().optional().default(0.05),
    lineDash: LineDash.optional().default("solid"),
    fillColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .default("#FFFFFF"),
    areaType: z.number().int().min(0).max(1).optional().default(0),
    wallHeight: z.number().optional().default(2),
    wallColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .default("#CCCCCC"),
    labelFontColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    labelFontSize: z.number().optional(),
    labelAlign: LabelAlign.optional().default("right"),
    labelPosition: LabelPosition.optional().default("bottom"),
    labelPlacementOnLine: LabelPlacementOnLine.optional().default("on"),
    labelBold: z.boolean().optional().default(true),
    labelItalic: z.boolean().optional().default(false),
    labelFont: z.string().optional(),
    labelOutlineColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional()
      .default("#FFFFFF"),
    labelOutlineWidth: z.number().optional().default(0.075),

    // Groups can also have connections
    connections: z.array(z.string()).optional().default([]),
  })
  .and(StylingProperties);

// Helper to detect and validate metadata properties (keys starting with meta-)
const isMetaKey = (key: string) => key.startsWith("meta-");

// Define the main diagram schema with dynamic metadata handling
const DiagramSchema = z.record(
  // Key: Component or group ID
  z.string(),
  // Value: Either a component or group with potential metadata properties
  z.union([ComponentSchema, GroupSchema])
);

// Configuration settings for diagram layout
const DiagramConfigSchema = z
  .object({
    MAX_COMPONENTS_PER_TIER: z.number().int().positive().optional().default(10),
    TIER_GAP: z.number().positive().optional().default(3),
    COMP_GAP: z.number().positive().optional().default(2),
    GROUP_MARGIN: z.number().positive().optional().default(1),
    GROUP_PADDING: z.number().positive().optional().default(0.75),
    LABEL_HEIGHT: z.number().positive().optional().default(0.75),
    LABEL_PADDING: z.number().positive().optional().default(0.25),
  })
  .partial();

export { ComponentSchema, DiagramConfigSchema, DiagramSchema, GroupSchema };
