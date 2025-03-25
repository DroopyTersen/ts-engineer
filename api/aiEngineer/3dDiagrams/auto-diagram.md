Arcentry Automatic Diagram Creation Format

Here is an example of a valid Diagram in JSON format.

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a"],
    "connections": ["db-a"]
  },
  "server-b": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a"],
    "connections": ["db-a"]
  },
  "server-c": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-b"],
    "connections": ["db-b"],
    "label": "Instance 14"
  },
  "server-d": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-b"],
    "connections": ["db-b"]
  },
  "server-e": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-b"],
    "connections": ["db-b"],
    "backgroundColor": "#202020",
    "primaryColor": "#E61876",
    "icon": "bolt",
    "iconColor": "#E61876"
  },
  "db-a": {
    "type": "component",
    "componentType": "database.postgres",
    "groups": ["vpn-c"]
  },
  "db-b": {
    "type": "component",
    "componentType": "database.postgres",
    "groups": ["vpn-c"]
  },
  "cdn-a": {
    "type": "component",
    "componentType": "networking.gcc-cloud-cdn",
    "connections": ["server-a", "server-b", "server-c", "server-e"]
  },
  "vpn-b": {
    "type": "group",
    "label": "VPN-E345dd34",
    "areaType": 1
  }
}
```

## Format for Automatic Diagram Creation

A flat list of components, their associated groups, connections, and other data. Each entry must have a unique id and a type. Additional fields depend on the type of the entry.

## Components

Components are the main building blocks of diagrams. In addition to id and type, each component must have a componentType, specifying what kind of component it is.

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server"
  },
  "server-b": {
    "type": "component",
    "componentType": "generic.server"
  }
}
```

See below for full list of valid component types.

## Connections

Connections specify the lines that connect components or groups with each other. Each connection field is an array of ids of other components or groups this component or group should connect to.

Please note - it's sufficient to specify connections once - e.g. if component a is connected to b, it's enough to specify connections: \['b'\] for component a.

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server",
    "connections": ["db-a"]
  },
  "server-b": {
    "type": "component",
    "componentType": "generic.server",
    "connections": ["db-a", "db-b"]
  },
  "db-a": {
    "type": "component",
    "componentType": "database.postgres"
  },
  "db-b": {
    "type": "component",
    "componentType": "database.postgres"
  }
}
```

## Arrows

You can add arrowheads to the end of specific or all connections originating at a given component or group by defining the arrowsTo setting. arrowsTo can either be set to all, causing all connections from this component to end in arrows or to an array of connections, e.g. \["server-a", "server-c"\].

```json
{
  "comp-a": {
    "type": "component",
    "componentType": "generic.server",
    "connections": ["db-a", "db-b"],
    "arrowsTo": "all"
  },
  "comp-b": {
    "type": "component",
    "componentType": "generic.server",
    "connections": ["db-c", "db-d"],
    "arrowsTo": ["db-d"]
  },
  "db-a": {
    "type": "component",
    "componentType": "database.postgres"
  },
  "db-b": {
    "type": "component",
    "componentType": "database.postgres"
  },
  "db-c": {
    "type": "component",
    "componentType": "database.postgres"
  },
  "db-d": {
    "type": "component",
    "componentType": "database.postgres"
  }
}
```

## Groups

Groups allow you to specify areas around your components, e.g. to visualize VPN/VPCs, security zones, etc. Each component can be part of one or more groups.

Groups are defined as arrays (or comma-separated lists for CSV) of group ids. These group ids don't have to be explicit entries in the table - though adding them as entries allows you to specify labels and styling rules.

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a"]
  },
  "server-b": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a"]
  },
  "server-c": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-b"]
  }
}
```

## Nested Groups

Often, you have multiple layers of groups within your infrastructure. Say, a Virtual Private Cloud on AWS that contains multiple subnets which in turn are home to multiple components.

Arcentry makes it easy to specify this. Simple list all groups a component belongs to, separated by commas (in CSV) or as an Array (in JSON).

Important: Your list of groups must be ordered from parent to child, e.g. VPC-A, Subnet-A.

```json
{
  "comp-a": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a", "subnet-a"]
  },
  "comp-b": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a", "subnet-a"]
  },
  "comp-c": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a", "subnet-b"]
  },
  "comp-d": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-b", "subnet-c"]
  },
  "comp-e": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-b", "subnet-c"]
  }
}
```

## Tiers

Tiers define how diagrams are ordered from front to back. Usually, they don't have to be explicitly specified. Arcentry will order components based on their category as follows:

- #### Tier 6 (all the way to the back):

  ai, analytics & storage

- #### Tier 5:

  databases

- #### Tier 4:

  data-processing, monitoring, devops

- #### Tier 3:

  media processing and message broker

- #### Tier 2:

  server instances, container, computation and caching

- #### Tier 1 (Front of Web Stack):

  security, api, networking

- #### Tier 0 (In Front):

  IoT, Client Devices

At times, however, you want to order things differently. Maybe your server cluster is divided into multiple tiers amongst themselves; maybe your analytics live all the way at the front. You can easily overwrite the default tiering be specifying tier with any numeric index.

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server",
    "tier": 1
  },
  "server-b": {
    "type": "component",
    "componentType": "generic.server",
    "tier": 1
  },
  "server-c": {
    "type": "component",
    "componentType": "generic.server",
    "tier": 2
  }
}
```

## Labels

Labels can be added to components and groups. For components, simply specify label: "My label" in their definition. For groups, you'd need to create an additional entry with id:groupId and type:'group' and add the label there.

Btw, by default, Arcentry chooses a random color for groups and label backgrounds based on the name of the group. To change this, simply specify e.g. "lineColor": "#00FF00" as part of your group settings.

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server",
    "label": "instance A",
    "groups": ["vpn-a"]
  },
  "server-b": {
    "type": "component",
    "componentType": "generic.server",
    "label": "instance B",
    "groups": ["vpn-a"]
  },
  "vpn-a": {
    "type": "group",
    "label": "VPN A1"
  }
}
```

## Styling

Every aspect of your diagram can be styled in any way you like. You can find an extensive [](https://arcentry.com/api-docs/properties/)list of all available properties here or simply style things in Arcentry's GUI and copy the properties you like from the object-data entry in the sidebar.

To apply styles, simply add them to your JSON along with id, type, groups, and all the other properties.

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server",
    "groups": ["vpn-a"],
    "backgroundColor": "#202020",
    "primaryColor": "#31E618",
    "icon": "bolt",
    "iconColor": "#31E618"
  },
  "vpn-a": {
    "type": "group",
    "lineColor": "#E64418",
    "lineWidth": 0.2,
    "shadowLevel": 2
  }
}
```

## Metadata

Arcentry allows you to store meta-data such as instance ids, number of cores, memory, etc. alongside any component. You can find more about metadata here.

To add metadata to your generated diagrams, simply prefix your column-names or JSON keys with meta-. (This prefix will be removed before insertion).

```json
{
  "server-a": {
    "type": "component",
    "componentType": "generic.server",
    "meta-instance-id": "I-453jdfg234",
    "meta-cores": 16,
    "meta-ram": "4GB"
  }
}
```

## Adding Margins and Paddings

## Usage

You can add all settings on this page as query string parameters to the end of your URL, e.g.

```

https://arcentry.com/dev/v1/create-diagram/ce223f94-2471-437f-8f1b-4f1ded0974ad?LABEL_HEIGHT=1&LABEL_PADDING=0.75&GROUP_MARGIN=2

```

This works the same for JSON and CSV requests. Keys are case-insensitive, you can specify them in upper or lowercase. Oh, and for all European users: decimal points are expressed with dots rather than commas.

## MAX_COMPONENTS_PER_TIER (default 10)

The amount of components that Arcentry will place in a horizontal line. Allows you to control how wide you'd like your diagram to be.

![Image 8: max components per tier](https://arcentry.com/api-docs/create-diagram-settings/max-components-per-tier.png)

## TIER_GAP (default 3)

The space between the vertical layers of a diagram.

![Image 9: tier gap](https://arcentry.com/api-docs/create-diagram-settings/tier-gap.png)

## COMP_GAP (default 2)

The space between the components in a group.

![Image 10: component gap](https://arcentry.com/api-docs/create-diagram-settings/comp-gap.png)

## GROUP_MARGIN (default 1)

The space between groups.

![Image 11: group margin](https://arcentry.com/api-docs/create-diagram-settings/group-margin.png)

## GROUP_PADDING (default 0.75)

The space between the borders of a group and the components within it.

![Image 12: group padding](https://arcentry.com/api-docs/create-diagram-settings/group-padding.png)

## LABEL_HEIGHT (default 0.75)

The height of group labels.

![Image 13: label height](https://arcentry.com/api-docs/create-diagram-settings/label-height.png)

## LABEL_PADDING (default 0.25)

The padding left and right of a group label.

![Image 14: label padding](https://arcentry.com/api-docs/create-diagram-settings/label-padding.png)

```

## Other Common Property definitions

Component
Specifies a single component / Arcentry object

Property	Default	Description
componentType	required	A component id, e.g. "database.postgres", "security.aws-amazon-cognito" or "generic.server".
groups	[]	A list of group ids this component is a child of.
connections	[]	A list of component or group ids this component is connected to.
label	null	A label to be displayed underneath this component.
opacity	1	A value that determines the opacity of a component from 0 (fully transparent) to 1(fully opaque)
rotation	0	The rotation of the component in radians (multiples of PI). E.g. 0, 1.5707963, 3.1415926, 4.712388
positionType	auto	How the component should be positioned. If omitted or set to "auto" Arcentry will position the component for you. If set to "relative" the component position can be specified relative to another component, if set to "absolute" the absolute position can be specified. Any positionType other than "auto" requires positionX and positionY to be set. If set to "relative", "positionRelativeTo" is required.
positionRelativeTo	required	The ID of a component this component should be positioned relative to. Required if "positionType" is set to "relative".
positionX	required	The absolute X coordinate of this component if "positionType": "absolute" or the relative X offset to the target component if "positionType": "relative".
positionY	required	The absolute Y coordinate of this component if "positionType": "absolute" or the relative Y offset to the target component if "positionType": "relative".
positionPointX	required	This property defines the horizontal point on a group's border a component is positioned relative to. It is only required if "positionType" is "relative" and "positionRelativeTo" points to a group. Possible values are "left", "middle" or "right".
positionPointY	required	This property defines the vertical point on a group's border a component is positioned relative to. It is only required if "positionType" is "relative" and "positionRelativeTo" points to a group. Possible values are "top", "middle" or "bottom".
positionPointY	required	The absolute Y coordinate of this component if "positionType": "absolute" or the relative Y offset to the target component if "positionType": "relative".
meta-*	N/A	A meta-data entry, e.g. meta-instance-id or meta-machine-size. Any entry starting with meta- will be added to the component's meta-data. For JSON based config it is also possible to specify meta-data as map, e.g. "meta": {"some-key": "some-value"}
showMetaData	false	If true, meta-data will be plotted onto the diagram, subject to the property settings below. Alternatively, showOnCanvas can be used to specify a subset of meta-data to be displayed on the diagram.
showOnCanvas	all	A comma-separated list of meta-data keys to be displayed on the diagram underneath the component. If your component has e.g. meta-cpu, meta-ram and meta-storage-size, but you only wish to display cpu and ram, specify "showOnCanvas": "cpu, ram"
showInTooltip	all	A comma-separated list of meta-data keys to be displayed in the context-menu/tooltip on embedded diagrams or in presentation-mode. If your component has e.g. meta-cpu, meta-ram and meta-storage-size, but you only wish to display cpu and ram, specify "showInTooltip": "cpu, ram"
showMetaDataKeys	true	If true, the keys (e.g. cpu, ram, machine size etc) are displayed as small, grey labels above the meta-data values.
metaDataFontSize	0.25	The font-size for the meta-data values displayed on the diagram. Keys will be displayed at half that font-size.
metaDataTextAlign	"center"	Text align for meta-data displayed on the diagram. Can be "left", "center" or "right".
Generic / Customizable Components
In addition to the general component properties documented above, generic components can be styled using additional properties. Components supporting these properties can be recognized by ids starting with generic., e.g. generic.database or generic.server.

Property	Default	Description
backgroundColor	#FFFFFF	Background color for the component in hex-notation, e.g. "#FF0000".
primaryColor	#CCCCCC	Accent color for the component in hex-notation, e.g. "#FF0000".
secondaryColor	#CCCCCC	A small number of components supports accents in a secondary color in hex-notation, e.g. "#FF0000".
icon	null	The name of an icon to be displayed on the component, e.g. "chart-bar", or "cloud". Please note: when using an image, set icon to null and specify an "imagePath" instead.
iconColor	#333333	The color for the icon, only applicable if "icon": true.
imagePath	null	Path to an image that was previously uploaded to Arcentry. If imagePath is specified, make sure that icon is set to null. "icon": true.
imageSize	1	Determines the size of the icon or image relative to the size of the component. Goes from 1 (full sized) to 0.001 (pretty much invisibly tiny).
Group
Groups can be styled in terms of appearance, style and label.

Property	Default	Description
label	null	A label to be displayed for the group.
labelStyle	"block"	Labels can either be displayed as "block" - large labels with a colorful background that extrude at the bottom of the group or "inline" - smaller, more flexible text that's displayed on or near the group's border.
lineColor	automatic	The color for lines and block label backgrounds. If no color is specified, Arcentry will select a constant color by hashing the root group's ID.
lineWidth	0.05	The width of the line surrounding the group.
lineDash	solid	The style of the line, can be "solid", "dashed" or "dotted".
fillColor	#FFFFFF	The fill color for the main area of the group.
areaType	0	Determines whether to display a wall around the group to indicate a security zone. Use 0 for no wall or 1 for a wall.
wallHeight	2	If areaType is set to 1, this value determines the height of the wall.
wallColor	#CCCCCC	If areaType is set to 1, this value determines the color of the wall.
labelFontColor	#FFFFFF (block) / #333333 (inline)	The font color for the label.
labelFontSize	0.5 (block) / 0.2 (inline)	The font size for the label.
labelAlign	right	Only applicable if labelStyle is inline. Possible values are "left", "center" or "right".
labelPosition	bottom	Only applicable if labelStyle is inline. Possible values are "top" or "bottom".
labelPlacementOnLine	on	Only applicable if labelStyle is inline. Determines where the label is placed in relation to the line. Possible values are "above", "on" or "below".
labelBold	true	Toggle bold on or off.
labelItalic	false	Toggle italic on or off.
labelFont	Arcentry Font	The font family for the label. The specified font needs to be installed on the target system.
labelOutlineColor	#FFFFFF	Color for the outline surrounding the label text.
labelOutlineWidth	0.075	The width of the outline surrounding the label text.
```
