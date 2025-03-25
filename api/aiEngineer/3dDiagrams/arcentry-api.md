<article>Title: Arcentry Rest API Properties Explained

URL Source: https://arcentry.com/api-docs/properties/

Markdown Content:
[Go to API Docs](https://arcentry.com/api-docs/)

## Object properties

Every object (component, line-group, area etc.) on an Arcentry diagram is defined by a set of properties - which ones depends on the kind of object in question. This guide gives you an overview of the available types and properties and how to use them in the context of the API

## Types

- component any cloud, open source or generic components. Components are identified by a unique componentId, e.g. database.postgres. Generic components support additional properties and can be identified by an id starting with generic, e.g. generic.block.
- line-group any line is represented as a line-group. Lines can be as simple as a single connection between two points and as complex as a multi-point, branching polyline with various arrowheads.
- label any text on the diagram is represented as a label
- area is a filled polygon - most often a rectangle.
- icon is a single, standalone icon. Icons on top of e.g. generic components are part of the component's properties.
- image is a flat image on the diagram. Images that are applied on top of generic components are defined as their properties.
- widget is any kind of interactive entity from the widget menu, e.g. a chart or a button (coming soon).

## Properties in general

Properties are specified as JSON objects, e.g. 'backgroundColor': '#FF0000'.

### Coordinates

![Image 1: Arcentry uses a cartesian coordinate system](https://arcentry.com/api-docs/properties/coordinate-system.png)

Arcentry objects are placed on a grid measuring 100x100 cells with an origin (the point with 0,0 coordinates) at the center. That means that coordinates can range from -50 to 50 for both x and y axis with each unit representing a cell on the grid. Units smaller than one cell are supported, but beware: different types can be moved at different resolutions:

- components, labels and anchor-points for line-groups are placed in half-cell steps (0, 0.5, 1, 1.5 etc.)
- area-anchors, icons, and images are placed in eights-cell steps (0, 0.125, 0.25 etc).

### Colors

All colors are expressed as six-digit HEX strings with a leading #, e.g. '#CC33FF', other formats are not supported. The only exception is the special color #00000000 which stands for invisibility.

## Components

![Image 2: Some standard components](https://arcentry.com/api-docs/properties/components.png)

Components have a mandatory id property that identifies which component it is.

```
{
      //required, identifies the component
      //please find the componentId for your component in the object data panel
      "componentId": "security.aws-secret-manager",

      // Replaces the default name (e.g. PostgreSQL)
      "name": "Public User Database",

      // Replaces the default description
      "desc": "Stores User and Account related data",

      // A list of links for this component
      "links": {
        "Open in AWS Console": "https://eu-central-1.console.aws.amazon.com/rds/home?region=eu-central-1#dbinstance:id=db2",
        "Open in Datadog": "https://www.datadoghq.com/app/#342af-543da"
      },

      //x and y coordinates on the grid
      "position": {
          "x": -6,
          "y": 6
      },
      // must be a multiple of Ï€/2, e.g. 0, 1.5707, 3.141 etc.
      "rotation": 0,
      // can be 0.25, 0.5, 0.75 and 1
      "opacity": 1
  }
```

## Generic Components

![Image 3: Some generic components](https://arcentry.com/api-docs/properties/generic-components.png)

Generic Components can be customized to reflect your parts of the system.

Generic components can either have an image or an icon, but not both. To choose which one, set either imagePath or icon to null.

```
{
  //required, ids for generic components start with generic.
  "componentId": "generic.server",

  // Replaces the default name (e.g. PostgreSQL)
  "name": "Public User Database",

  // Replaces the default description
  "desc": "Stores User and Account related data",

  // A list of links for this component
  "links": {
    "Open in AWS Console": "https://eu-central-1.console.aws.amazon.com/rds/home?region=eu-central-1#dbinstance:id=db2",
    "Open in Datadog": "https://www.datadoghq.com/app/#342af-543da"
  },

  //position on the grid
  "position": {
      "x": -8,
      "y": 8
  },
  // must be a multiple of Ï€/2, e.g. 0, 1.5707, 3.141 etc.
  "rotation": 0,
  // can be 0.25, 0.5, 0.75 and 1
  "opacity": 1
  // the color for the highlighted parts of the component
  "primaryColor": "#FFFFFF",
  // color of the component background
  "backgroundColor": "#202020",
  // the path to an image. Must point to an image stored by arcentry
  // set to null if icons are used
  "imagePath": "eb0c0d1e85ff7923c79ae307d86ecc/unicorn.png",,
  // color for the icon
  "iconColor": "#FFFFFF",
  // an icon code, set to null if imagePath is used
  "icon": "bomb"
}
```

## Line Groups

![Image 4: linegroups header](https://arcentry.com/api-docs/properties/line-groups.png)

Line Groups are a bit trickier: Lines in Arcentry don't necessarily just go from A to B, but can branch off into more complex structures. To describe these, Arcentry uses two concepts: anchors and lines.

- An anchor is a point that one or more lines can connect to. There's two type of anchors, distinguished by their 'type' property: standalone (type = 0) and object (type = 1).

  A _standalone anchor_ is a point identified by x and y coordinates

  ````
  {
    "type": 0,
    "x": -9,
    "y": 3.5
  }
  ```An _object anchor_ connects a line to a component. It doesn't have coordinates, but instead references the component's id and the index of its anchor point it connects to.

  ````

  {
  "type": 1,
  "index": 2,
  "id": "1clr7a9cn-pc3rjgomb"
  }

  ```

  ```

- A _line_ is a segment that connects two anchor points. Lines are array with two anchor indices, e.g. \[3,6\]

Let's look at some examples:

### A simple line from A to B

````
{
  "strokeStyle": "#E61898",
  "lineWidth": 0.075,
  "lineDash": 1,
  "arrowAnchorIndices": {},
  "anchors": [
    {"type": 0, "x": -2, "y": 14},
    {"type": 0, "x": -2, "y": 12}
  ],
  "lines": [
    [0,1]
  ]
}
``` ![Image 5: A single line between two anchor points](https://arcentry.com/api-docs/properties/single-line.png)

To draw a simple line between two points, create two standalone anchorpoints (type=0) and one line entry connecting both \[0,1\]

### A line connecting to a component

````

{
"strokeStyle": "#E61898",
"lineWidth": 0.075,
"lineDash": 1,
"arrowAnchorIndices": {},
"anchors": [
{ "type": 0, "x": -3.5, "y": 9.5 },
{ "type": 0, "x": -3.5, "y": 7.5 },
{ "type": 1, "index": 7, "id": "1clrg6f31-iqvmoa49l" }
],
"lines": [
[0,1],
[1,2]
]
}

```![Image 6: A single line connecting to a component](https://arcentry.com/api-docs/properties/component-anchor.png)

Here a line goes through two anchor points and finally connects to a component with id '1clrg6f31-iqvmoa49l' at anchorpoint index 7. (Component anchors start at 0 in the top-left corner and increase clockwise). This allows the line to stay connected to the component when either is moved.

### A branching line

```

{
"strokeStyle":"#E61898",
"lineWidth":0.075,
"lineDash":1,
"arrowAnchorIndices":{"3":true,"5":true,"6":true},
"anchors":[
{"type":0,"x":-5,"y":8.5},
{"type":0,"x":-5,"y":6.5},
{"type":0,"x":-6,"y":6.5},
{"type":0,"x":-6,"y":5},
{"type":0,"x":-4,"y":6.5},
{"type":0,"x":-4,"y":5},
{"type":0,"x":-5,"y":5}
],
"lines":[
[0,1], [1,2], [2,3],
[1,4], [4,5], [1,6]
]
}

```![Image 7: A branching line with arrow tips, forming a pitch fork](https://arcentry.com/api-docs/properties/multi-line.png)

Here the line forks at a central anchor point (index: 1). Note the arrowAnchorIndices objects which specifies which anchor points end in an arrow tip.

### All Line Group Properties

```

{
// The color of the line
"strokeStyle":"#E61898",
// The width of the line. Possible values are 0.025, 0.05, 0.075, 0.1, 0.125
"lineWidth": 0.075,
// 1 = solid, 2 = dashed, 3 = dotted
"lineDash":1,
// An object listing the anchor points that end in arrows
"arrowAnchorIndices":{"3":true,"5":true,"6":true},
// Array of anchors
"anchors":[
// Standalone anchor
{"type":0,"x":-5,"y":8.5},
// Object anchor
{ "type": 1, "index": 7, "id": "1clrg6f31-iqvmoa49l" }
],
// Array of lines from anchorpoint index to another anchorpoint index
"lines":[
[0,1]
]
}

```

Areas
-----

![Image 8: area examples](https://arcentry.com/api-docs/properties/areas.png)

Areas are defined using a linear series of anchor points with x and y coordinates.

```

{
// an array of anchor points. Anchor points always form closed polygons
"anchors": [
{ "x": 7.75, "y": 5.5 },
{ "x": 8.375,"y": 5.5 },
{ "x": 8.25, "y": 6 },
{ "x": 9.5, "y": 6.5 },
{ "x": 7.75, "y": 6.5 }
],
// The color the area is filled with. Use #00000000 for no fill
"fillColor": "#BFBFBF",
// The color of the area's outline. Use #00000000 for no outline
"lineColor": "#606060",
// the width of the area's outline. Possible values are 0.025, 0.05, 0.075, 0.1, 0.125
"lineWidth": 0.05,
// The height of the drop shadow underneath the line. Possible values
// are 0 (none), 1, 2 and 3
"shadowLevel": 1,
// Indicates the stacking order for multiple stacked areas on
// top of each other
"zIndex": 0,
}

```

Icons
-----

![Image 9: A selection of Arcentry icons](https://arcentry.com/api-docs/properties/icons.png)

Arcentry uses a subset of the [Font Awesome icon set](https://fontawesome.com/icons?d=gallery&s=brands,solid&m=free). Please find a list of available icons [here](https://fontawesome.com/icons?d=gallery&s=brands,solid&m=free).

```

{
// the type of the icon.
"icon": "heart",
// color of the icon itself. Use #00000000 for transparent icons
"color": "#E61898",
// size of the icon. Supported values are 0.25, 0.35, 0.5, 0.7 and 1
"fontSize": 0.5,
// position of the icon on the grid
"position": {
"x": 8.25,
"y": -0.75
},
// Rotation as a multiple of Ï€/2
"rotation": 4.71238898038469,
// Color of the icons outline. Use #00000000 for no outline
"outlineColor": "#00000000"
}

```

Images
------

![Image 10: image example](https://arcentry.com/api-docs/properties/images.png)

Images must be uploaded to Arcentry before they can be used.

```

{
//Position of the images top left corner
"position": {
"x": -10,
"y": 13.875
},
//dimensions of the image
"dimensions": {
"width": 1.625,
"height": 1.125
},
// path to the image stored by Arcentry
"path": "eb0c0d1e85fcd77a5f679ae307d86ecc/unicorn.png",
// If true, the image will fill be stretched to the provided dimensions
// If false, the images aspect ration will be retained
"stretchToSize": false,
// Rotation as a multiple of Ï€/2
"rotation": 0
}

```

Widgets
-------

![Image 11: Some Charts](https://arcentry.com/api-docs/properties/chart.png)

Widgets in Arcentry are (or more precisely will be, we've just introduced them :-) a collection of visualization and interactive components, each with their own functionality and data-schema.

### Charts

```

{
// Currently only "chart" is supported
"widgetType": "chart",

// Determines where the chart gets its data from. Valid values are "api" or "cloudwatch"
"dataSource": "cloudwatch",

// The data for the chart, only applicable if dataSource === "api".
// Data is expected to be an array of arrays with two entries, one for x and one for the y axis
// For time based charts, please provide a second or millisecond timestamp as the first value for
// each entry
"data": [
[ 1, 34 ],
[ 2, 43 ],
[ 3, 12 ]
],

// Only applicable if dataSource === "cloudwatch".
"monitoring-aws-cloudwatch": {
// For charts, metrics can only hold a single key
"metrics": {
// This is a random id - if creating a chart via the api just pass
// metric-
"metric-1crb317bl-qkveqteod": {
// the time span for the chart, can be 1H, 4H, 8H, 1D, 2D, 3D, 1W
"span": "3D",
// the cloudwatch metric you'd like to display. For more on
// cloudwatch metrics, namespaces and dimensions please have a look at
// https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/cloudwatch_concepts.html
"metric": "ReadIOPS",
"namespace": "AWS/RDS",
"statistic": "Average",
"dimensions": [
{
"Name": "DBInstanceIdentifier",
"Value": "rds-db-small"
}
]
}
}
},

// Only applicable if plotType === "line". Determines if the area under the line shoud be filled
"fillChart": true,

// Color for line and bar charts
"lineColor": "#F79400",

// Determines whether labels for the yAxis should be displayed
"showLabels": true,

//Can be "auto" or "custom". If auto, the min and max values for the y axis are set automatically
"yAxisSpace": "auto",

//Sets min and max values for the y axis if yAxisSpace === "auto"
"maxY": 0.59,
"minY": 0.13,

// Can be "line" or "bar"
"plotType": "line",

// The position of the top left corner of the chart
"position": {
"x": -9.125,
"y": 2.125
},

// Size of the chart
"dimensions": {
"width": 8.875,
"height": 4.375
}
}

```
</article>

<article>
Title: Arcentry Meta-Data Documentation

URL Source: https://arcentry.com/api-docs/meta-data/

Markdown Content:
Arcentry Meta-Data Documentation
===============

Meta Data
=========

Metadata is a great way to associate Arcentry component visualizations with their real-world counterparts up in the cloud. It allows you to add any number of key-value pairs, e.g. an AWS Instance ID or ARN, a Docker Image name or a dynamic property such as status: booting to a component.

This meta-information can simply be displayed as a label that's directly linked to its component or it can be used to find and manipulate components via the API.

How do I add Metadata to a component?
-------------------------------------

You can add Metadata manually via the Metadata-panel that appears at the bottom of the sidebar whenever a component is selected.

![Image 3: Manually adding metadata via the panel in the sidebar](https://arcentry.com/api-docs/meta-data/add-metadata-manually.png)It is also possible to set Metadata programmatically when [creating](https://arcentry.com/api-docs/meta-data/#) or [updating](https://arcentry.com/api-docs/meta-data/#) an object via the API. To do so, simply include a Metadata key in your properties, e.g.

```

{
"props": {
"meta": {
"Instance ID": "i-06d7f0be6d177c918",
"Status": "running"
}
}
}

```

How do I display Metadata in an Arcentry diagram?
-------------------------------------------------

To display Metadata as a label next to a component, simply click the checkbox labeled "show meta data next to component"

![Image 4: metadata checkbox](https://arcentry.com/api-docs/meta-data/show-meta-data.png)You can also decide whether you want to display only the values (fields on the right) or also the keys for your Metadata - as well as set rotation, font-size, and alignment.

How do I search or manipulate components based on Metadata?
-----------------------------------------------------------

There are two API Endpoints that let you interact with your document using Metadata: Sending a get request to v1/doc/{docId}/obj/where/{selector} will return a list of objects that match your selector, sending a post request to v1/doc/{docId}/obj/where allows you to set properties for all objects matching a given selector.

Selectors
---------

You can query components based on their Metadata using Selectors. Selectors are simple, JSON formatted arrays with exactly three entries: key, operator and value.

Supported operators are

*   "eq" Equals - type-insensitive equality
*   "gt" Greater than for numbers and lexical comparison of strings
*   "lt" Less than for numbers and lexical comparison of strings
*   "co" Contains - checks if a string contains another string
*   "no" Not - property doesn't have the given value or doesnt exist

Here are some examples

```

// A simple selector to retrieve an item by its id
[ "InstanceID", "eq", "i-06d7f0be6d177c918"]

// Here we retrieve all items deployed
// in an eu region, e.g. eu-central-1, eu-west-2 etc.
[ "Region", "co", "eu" ]

// You can also provide arrays of selectors. Selectors are chained with
// AND, meaning that items have to match all criteria to be returned
// Here's e.g. how to get all running processes within a specific VPC
[
[ "vpc", "eq", "vpc-cf01f4e3" ],
[ "status", "eq", "running" ]
]

````

#### Using Selectors in URLs

Please note - whenever you use a selector within an URL, e.g. for v1/doc/{docId}/obj/where/{selector} the selector must be URL encoded. This can be achieved using e.g. encodeURI( selector ) in JS/Node, urlencode( $selector ) in PHP, QueryEscape( selector ) in GO or [jumping through a few extra hoops in Java](https://stackoverflow.com/questions/607176/java-equivalent-to-javascripts-encodeuricomponent-that-produces-identical-outpu)

</article>

<article>
Title: Documents - Arcentry Rest API Endpoint

URL Source: https://arcentry.com/api-docs/documents/

Markdown Content:
Documents are the diagrams you create in Arcentry. Using this API you can create, update, and manipulate documents in any way the app does.

List All Documents
------------------

Lists the ids and titles of all documents for this account.

`GET https://arcentry.com/api/v1/doc`

Response Data ```
[{
    "id": "d341ef2f-9f9f-4ad8-900b-7c1715d3324a",
    "title": "Google Cloud Reference Architecture"
}, {
    "id": "2ea7167c-ef44-4a0c-b158-3ba9fc05ef18",
    "title": "High Throughput 1"
}]
````

Show example request `curl --header "Authorization: Bearer YOUR_API_KEY" https://arcentry.com/api/v1/doc/`

## Get details for a document

Get user, folder creation and change dates for a given document.

`GET https://arcentry.com/api/v1/doc/_DOC_ID_`

Response Data ```
{
"id": "d341ef2f-9f9f-4ad8-900b-7c1715d3324a",
"title": "Google Cloud Reference Architecture",
"created": "2018-07-08T09:48:24.882Z",
"lastChange": "2018-07-08T11:45:10.160Z",
"user": {
"id": "f3cb0f2a-d25f-48ec-b75c-b62273709cfe",
"email": "someuser@gmail.com"
},
"folder": {
"id": "40a0c77b-5a32-4aed-bbb6-1295b83b38fb",
"title": "Reference Architectures"
}
}

````

Show example request `curl --header "Authorization: Bearer YOUR_API_KEY" https://arcentry.com/api/v1/doc/d341ef2f-9f9f-4ad8-900b-7c1715d3324a`

Get the content of a document
-----------------------------

Returns the entire content of a document, including objects, their properties and meta information.

`GET https://arcentry.com/api/v1/doc/_DOC_ID_/obj/all`

Response Data ```
{
    "1clduvg8g-n9fo5mofb": {
        "type": "label",
        "data": {
            "text": "42%",
            "color": "#2C8C05",
            "fontSize": 0.35,
            "position": { "x": 14.5, "y": -19.5 },
            "rotation": 0,
            "fontStyle": { "bold": true, "italic": false },
            "textAlign": "center",
            "dimensions": { "width": 4, "height": 1 },
            "fontFamily": "\"Open Sans\",-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
            "outlineColor": "#FFFFFF",
            "outlineWidth": 0.075
        }
    },
    "1cldvagbj-nde18vr1l": {
        "type": "component"
        "data": {
            "componentId": "networking.aws-api-gateway",
            "opacity": 1,
            "position": { "x": 14, "y": -23.5 },
            "rotation": 1.5707963267948966
        },
    }
}
````

Show example request `curl --header "Authorization: Bearer YOUR_API_KEY" https://arcentry.com/api/v1/doc/d341ef2f-9f9f-4ad8-900b-7c1715d3324a/obj/all`

## Set the content of a document

Sets the entire content of a document. This can be used to create diagrams from scratch or to load JSON files that were previously exported using the "download as JSON" feature in the app. _WARNING: THIS WILL REPLACE ALL EXISTING CONTENT OF THE DOCUMENT!_

`POST https://arcentry.com/api/v1/doc/set-content/_DOC_ID_`

Request Data ```
{
// The JSON content of the document. IMPORTANT: In difference to the create
// and update object APIs, set-content will NOT validate or add missing fields to your
// object data. If a value is missing or incorrect, your document may be corrupted.
// If nothing else works, you can always empty it (see next method) and start over.
"1ckelh58q-h2us6u6m": {
"type": "component",
"data": {
"icon": "cogs",
"opacity": 1,
"position": { "x": -3.5, "y": -2 },
"rotation": 0,
"iconColor": "#FFFFFF",
"imagePath": null,
"componentId": "generic.server",
"primaryColor": "#FFFFFF",
"backgroundColor": "#404040"
}
},
"1ckeo4tul-c05td66d": {
"type": "label",
"data": {
"text": "DB Cluster",
"color": "#606060",
"fontSize": 0.35,
"position": { "x": -1, "y": -4 },
"rotation": 0,
"fontStyle": { "bold": true, "italic": false },
"textAlign": "center",
"dimensions": { "width": 4, "height": 1 },
"fontFamily": "\"Open Sans\",-apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Roboto\", \"Oxygen\", \"Ubuntu\", \"Cantarell\", \"Fira Sans\", \"Droid Sans\", \"Helvetica Neue\", sans-serif",
"outlineColor": "#FFFFFF"
}
}

````

Response Data `{ "success": true }`

Show example request ```

curl \
  -d "@my-file.json" \
  -H "Authorization: Bearer 0b9cc1ca2b3bee7a64498345049eaaa49a31544c1481381c583c11a5661daccd" \
  -H "Content-Type: application/json" \
  -X POST \
  https://arcentry.com/api/v1/doc/set-content/90669c3a-86de-4923-a8df-3f7bbfae9717

````

## Create a new document

Creates a new, empty document.

`POST https://arcentry.com/api/v1/doc/create`

Request Data ```
{
// A title describing your document
"title": "Web Tier 14",

// OPTIONAL: The id of a folder the document should be placed
// into. If folderId is omitted, the document will be created in
// the first folder you have. You can get a list of folderIds by
// calling the v1/folder/list endpoint
"folderId": "b267971d-8379-4d2e-bdba-ed9962409fc8"
}

````

Response Data ```
{
     "success": true,

     // The ID of the newly created document
     "docId": "4030c27b-5a32-4aed-bbb6-111183b38fb"
   }
````

## Empty a document

Deletes all objects from a document.

`POST https://arcentry.com/api/v1/doc/empty`

Request Data `{ "docId": "b267971d-8379-4d2e-bdba-ed9962409fc8" }`

Response Data `{ "success": true }`

## Add a collaborator to a document

Share this document with another user and collaborate with them in realtime. Calling this endpoint will send a notification to the other account's Arcentry app, and the document will show up under their "shared with me" tab in the document panel. Please note: This only works for existing accounts. Arcentry will not send out email invites (sorry, spam laws). If the account doesn't exist, this endpoint will return a 404 response with a USER_NOT_FOUND error.

`POST https://arcentry.com/api/v1/doc/add-collaborator`

Request Data ```
{
"docId": "b267971d-8379-4d2e-bdba-ed9962409fc8",
"email": "some-user@your-company.com"
}

````

Response Data `{ "success": true }`

Change a document's title
-------------------------

`POST https://arcentry.com/api/v1/doc/change-title`

Request Data ```
{
    "docId": "b267971d-8379-4d2e-bdba-ed9962409fc8",
    "title": "A shiny new title"
}
````

Response Data `{ "success": true }`

## Clone a document

Creates a new document with the content of an existing document.

`POST https://arcentry.com/api/v1/doc/clone`

Request Data ```
{
// Id of the existing document you wish to clone
"docId": "b267971d-8379-4d2e-bdba-ed9962409fc8",

       // Title for the new document
       "title": "Clone of Backend Architecture"

}

````

Response Data ```
{
       "success": true,

       // Id of the cloned document
       "docId": "71f9703e-9a10-4667-a8d8-24ab28dea183"
   }
````

## Delete a document

Irrevocably deletes a document and all its contents.

`POST https://arcentry.com/api/v1/doc/delete`

Request Data `{ "docId": "b267971d-8379-4d2e-bdba-ed9962409fc8" }`

Response Data `{ "success": true }`

</article>

<article>
Title: Objects - Arcentry Rest API Endpoint

URL Source: https://arcentry.com/api-docs/objects/

Markdown Content:
Objects - API DOCS

---

Each entity on an Arcentry diagram is an object: Components, Areas, Line Groups, Images, Widgets, and Icons can all be created and manipulated in realtime using this API.

## Get Object by ID

Returns all properties for the object with the given ID

`GET https://arcentry.com/api/v1/doc/_docId_/obj/_objId_`

Response Data ```
{
"type": "label",
"data": {
"text": "Monitoring Endpoint",
"color": "#EA4335",
"fontSize": 0.5,
"position": { "x": -28.25, "y": -25.5 },
"rotation": 0,
"fontStyle": { "bold": true, "italic": false },
"textAlign": "right",
"dimensions": { "width": 4, "height": 1 },
"fontFamily": "\"Open Sans\",-apple-system, BlinkMacSystemFont, \"Helvetica Neue\", sans-serif",
"outlineColor": "#FFFFFF",
"outlineWidth": 0.1
}
}

````

Show example request `curl --header "Authorization: Bearer YOUR_API_KEY" https://arcentry.com/api/v1/doc/d341ef2f-9f9f-4ad8-900b-7c1715d3324a/obj/1chsmqmgt-q6lfvkevo`

Retrieve Data for Objects matching a selector
---------------------------------------------

Retrieves all objects where [Metadata](https://arcentry.com/api-docs/meta-data/) matches a given [Selector](https://arcentry.com/api-docs/meta-data/#selectors)

`GET https://arcentry.com/api/v1/doc/_docId_/obj/where/_selector_`

Response Data for selector \["dockerImg","eq","mysql-small"\] ```
{
    "1cml7vrs0-ef6r4n2uv": {
        "type": "component",
        "data": {
            "meta": { "dockerImg": "mysql-small" },
            "opacity": 1,
            "position": { "x": 6, "y": 1 },
            "rotation": 0,
            "componentId": "database.mysql",
            "showMetaData": true,
            "metaDataFontSize": 0.5,
            "metaDataRotation": 0,
            "showMetaDataKeys": true,
            "metaDataTextAlign": "center"
        }
    },
    "1cml7v3dp-13nr9eg006": {
        "type": "component",
        "data": {
            "meta": { "dockerImg": "mysql-small" },
            "opacity": 1,
            "position": { "x": 2, "y": 1 },
            "rotation": 0,
            "componentId": "database.mysql",
            "showMetaData": true,
            "metaDataFontSize": 0.5,
            "metaDataRotation": 0,
            "showMetaDataKeys": true,
            "metaDataTextAlign": "center"
        }
    }
}
````

Show example request `curl  --header "Authorization: Bearer YOUR_API_KEY" https://arcentry.com/api/v1/doc/a9b5a951-1ff6-4ea8-a28d-ec5956187354/obj/where/%5B%22dockerImg%22,%22eq%22,%22mysql-small%22%5D`

## Create a new object

#### Request Parameters

- type requiredThe type of the object, can be 'component', 'line-group', 'label', 'icon', 'area', 'widget' or 'image'
- props required, but can be an empty objectThe properties to create the object with. Different types support different properties, please find a [detailed list here](https://arcentry.com/api-docs/objects/properties). Any property that isn't specified will be replaced by its default value. Please note: for components (type == 'component') you must specify componentId as a property.

`POST https://arcentry.com/api/v1/doc/_docId_/obj/`

Request Data ```
{
"type": "label",
"props":{
"text":"Hello World!",
"position":{
"x":-10,
"y":20
}
}
}

````

Response Data ```
{
    success: true,
    objId: "1cml7v3dp-13nr9eg006"
}
````

Show example request ```
curl \
 -d '{"type":"label", "props":{"text":"Hello World","position":{"x":-10,"y":20}}}' \
 -H "Authorization: Bearer 9ce7f16d4a6647f3d74491560ec64ff87a6faa015c4178a7c5739dca900aa4bf" \
 -H "Content-Type: application/json" \
 -X POST \
 https://arcentry.com/api/v1/doc/d341ef2f-9f9f-4ad8-900b-7c1715d3324a/obj/1chsmqmgt-q6lfvkevo/obj

````

Update an existing object
-------------------------

Updates the properties of an existing object. You can set as few or as many properties as you like - any JSON will be merged into the object's current data structure. Please note that the merge is non-recursive, so nested properties, e.g. "position":{"x":2,"y":3} need to contain all fields.

#### Request Parameters

*   props requiredOne or more properties to merge into the existing object data. Different object types support different properties, please find a [detailed list here](https://arcentry.com/api-docs/objects/properties).


`POST https://arcentry.com/api/v1/doc/_docId_/obj/_objId_`

Request Data ```
{
    "props":{
        "color": "#F0000F",
        "position":{
            "x":5,
            "y":2
        }
    }
}
````

Response Data `{ success: true }`

Show example request ```
curl \
 -d '{"props":{"color": "#F0000F","position":{"x":5,"y":2}}}' \
 -H "Authorization: Bearer 9ce7f16d4a6647f3d744915605434ff87a6577015c4178a7ccf59dca900aa4bf" \
 -H "Content-Type: application/json" \
 -X POST \
 https://arcentry.com/api/v1/doc/980482ba-54d7-427d-8dbf-f23745d233fa/obj/1claqoit6-12ft652qhj

````

Update multiple objects in bulk
-------------------------------

Updates the properties of multiple existing objects. You can set as few or as many properties as you like - any JSON will be merged into the object's current data structure. Please note that the merge is non-recursive, so nested properties, e.g. "position":{"x":2,"y":3} need to contain all fields.

#### Request Parameters

*   objects required

`POST https://arcentry.com/api/v1/doc/_docId_`

Request Data ```
{
    "objects":{
        "1cn24l762-mro0uporu":{
            "text":"Critical",
            "color":"#259E07"
        },
        "1cn24l762-8qo4f10hg":{
            "fillColor":"#FFFFFF"
        }
    }
}
````

Response Data `{ success: true }`

Show example request ```
-d '{"objects":{"1cn24l762-mro0uporu":{"text":"Enabled","color":"#259E07"},"1cn24l762-8qo4f10hg":{"fillColor":"#FFFFFF"}}}' \
 -H "Authorization: Bearer 9ce7f16d4a6647f3d744915605434ff87a6577015c4178a7ccf59dca900aa4bf" \
 -H "Content-Type: application/json" \
 -X POST \
 https://arcentry.com/api/v1/doc/980482ba-54d7-427d-8dbf-f23745d233fa/

````

Update multiple objects matching a selector
-------------------------------------------

Similar to the [id based update object endpoint](https://arcentry.com/api-docs/objects/#set-properties-for-an-object), but this can update multiple objects at once, based on their [Metadata](https://arcentry.com/api-docs/meta-data/).

#### Request Parameters

*   selector requiredA selector that finds objects based on their associated metadata. [Please find more here](https://arcentry.com/api-docs/meta-data/#selectors).

*   props requiredOne or more properties to merge into the existing object data. Different types support different properties, please find a [detailed list here](https://arcentry.com/api-docs/objects/properties).


`POST https://arcentry.com/api/v1/doc/_docId_/obj/where`

Request Data ```
{
    "selector":["status","eq","running"],
    "props":{"backgroundColor": "#00FF00"}
}
````

Response Data ```
{
"success": true,
"updatedObjectCount": 2,
"updatedObjectIds": [
"1cml7vrs0-ef6r4n2uv",
"1cml7v3dp-13nr9eg006"
]
}

````

Show example request ```
curl \
    -d '{"selector":["status","eq","running"],"props":{"backgroundColor": "#00FF00"}}' \
    -H "Authorization: Bearer 9ce7f16d4a6647f3d744915605434ff87a6577015c4178a7ccf59dca900aa4bf" \
    -H "Content-Type: application/json" \
    -X POST \
    https://arcentry.com/api/v1/doc/980482ba-54d7-427d-8dbf-f23745d233fa/obj/where/
````

## Delete an Object

Deletes an object from its document

`POST https://arcentry.com/api/v1/doc/_docId_/obj/_objId_/delete`

Response Data `{"success":true}`

Show example request ```
curl \
 -H "Authorization: Bearer 9ce7f16d4a6647f3d74491560ec64ff87a6faa015c4178a7c5739dca900aa4bf" \
 -H "Content-Type: application/json" \
 -X POST \
 https://arcentry.com/api/v1/doc/980482ba-54d7-427d-8dbf-f23745d233fa/obj/1claqoit6-12ft652qhj/delete

````
</article>

<article>
Title: Folders - Arcentry Rest API Endpoint

URL Source: https://arcentry.com/api-docs/folders/

Markdown Content:
Folders - Arcentry Rest API Endpoint
===============


Folders - API DOCS
==================

Arcentry's documents are organised in a flat folder structure without subfolders. This API makes it possible to programatically create, list, update and delete folders.

Create a new folder
-------------------

#### Request Parameters

*   title required

    The title of the folder.


`POST https://arcentry.com/api/v1/folder/create`

Request Data `{ "title": "EU North Deployments"}`

Response Data ```
{
    "success": true,
    "folderId":"9ce70f08-0ae1-4277-badc-131fdc47d928"
}
````

Show example request ```
curl \
 -d '{"title": "EU North Deployments"}' \
 -H "Authorization: Bearer 6b4f49e064e1537a050d06067fc6cac42e5aa4e59cb43ff6b975a596331f31e9" \
 -H "Content-Type: application/json" \
 -X POST \
 https://arcentry.com/api/v1/folder/create

````

List folders
------------

Returns folderIds, titles and the ids and titles of the decuments contained in each folder

`GET https://arcentry.com/api/v1/folder/list`

Response Data ```
{
    "c9d26e60-d107-467d-92ad-e288ad738a8f": {
        "title": "Google Cloud Deployments",
        "docs": {
        "6f3b7f4a-bed0-4304-b590-ca2b96305435": "Dev Stack",
        "6dec1f4c-ff79-4524-ad47-d1458c9ca87d": "Prod Stack"
        }
    },
    "8766ce3c-b8d3-4b05-a7c2-69b631339292": {
        "title": "On Premise",
        "docs": {
        "6dec1f4c-ff79-4524-ad47-d1458c9ca87d": "Local Stack"
        }
    }
}
````

Show example request ```
curl \
 -H "Authorization: Bearer 6b4f49e064e1537a050d06067fc6cac42e5aa4e59cb43ff6b975a596331f31e9" \
 -H "Content-Type: application/json" \
 https://arcentry.com/api/v1/folder/list

````

Updates a folder title
----------------------

#### Request Parameters

*   title required

    The title of the folder.

*   folderId required

    The id of the folder.


`POST https://arcentry.com/api/v1/folder/change-title`

Request Data ```
{
    "title": "EU South Deployments",
    "folderId":"9ce70f08-0ae1-4277-badc-131fdc47d928"
}
````

Response Data `{ "success": true }`

## Delete a folder

Deletes the folder AND ALL DOCUMENTS WITHIN IT! (Use with caution :-)

#### Request Parameters

- title required

  The title of the folder.

- folderId required

  The id of the folder.

`POST https://arcentry.com/api/v1/folder/delete`

Request Data `{ "folderId":"9ce70f08-0ae1-4277-badc-131fdc47d928" }`

Response Data `{ "success": true }`

Â©2025 Arcentry, Inc.

Arcentry, Inc.  
2035 Sunset Lake Road  
19702 Newark, USA

[@arcentry](https://twitter.com/arcentry) [Youtube Channel](https://www.youtube.com/channel/UCCv3ZhafMXS4E0JqmyFb72g) [info@arcentry.com](mailto:info@arcentry.com)

[Terms of Use](https://arcentry.com/assets/pdf/terms-of-use.pdf) [Privacy Policy](https://arcentry.com/assets/pdf/privacy-policy.pdf) [Cookie Policy](https://arcentry.com/assets/pdf/cookie-policy.pdf)

By continuing to use this website, you consent to the use of cookies in accordance with our [Cookie Policy](https://arcentry.com/api-docs/folders/legal/cookie-policy.pdf).

</article>

<article>
Title: Embeds - Arcentry Rest API Endpoint

URL Source: https://arcentry.com/api-docs/embed/

# Embeds - API DOCS

Arcentry makes it easy to embed diagrams into third party applications, blogposts, and websites. There are fundamentally two ways to do that, both of which will create an iFrame URL: Static and Live Embeds.

### Static Embeds

Static Embeds create a copy of a document at the given point in time. This means you can create as many static embeds from the same document at different stages as you like.

### Live Embeds

Live embeds create a URL that makes a given document public and allows you to embed it. Any change, whether through the Arcentry app or the API will be reflected in this document at realtime. Please note, live embeds are limited to five simultaneous connections per embed.

## Create a static embed

Creates a static copy of a document to be embedded into another site.

#### Request Parameters

- docId required

  The ID of the source document.

- title optional

  An optional title, will be displayed in the list of embeds

`POST https://arcentry.com/api/v1/embed/create-static`

Request Data `{ "docId": "9ce70f08-0ae1-4277-badc-131fdc47d928" }`

Response Data ```
{
"success":true,
// The ID of the embed (if you wish to delete it later)
"id":"363cf432-c884-415d-a975-9614634154e2",
// The embeddable URL. Stick it into an iFrame
"url":"https://arcentry.com/app/embed.html?id=363cf432-c884-415d-a975-9614634154e2&camera=0_0.7854_7.6667_-0.7854_0.6155_0.5236_450_450_450&hideViewControls=0"
}

````

Show example request ```
curl \
    -d '{"docId": "901d1e2b-0bb4-494b-ac25-4c361b4238d5"}' \
    -H "Authorization: Bearer 6b4f49e064e1537a050d06067fc6cac42e5cc2e59cb43ff6b975a596331f31e9" \
    -H "Content-Type: application/json" \
    -X POST \
    https://arcentry.com/api/v1/embed/create-static
````

## Delete a static embed

Deletes a previously created static embed and will prevent any iFrame using it from working.

#### Request Parameters

- id required

  The ID of the embed - will be returned by create-static.

`POST https://arcentry.com/api/v1/embed/delete-static`

Request Data `{ "id": "9ce70f08-0ae1-4277-badc-131fdc47d928" }`

Response Data `{ "success":true }`

## Enable Live Embed

Enables an existing document to be embedded into a webpage etc.

#### Request Parameters

- docId required

  The ID of the document to be embedded.

`POST https://arcentry.com/api/v1/embed/enable-live`

Request Data `{ "docId": "9ce70f08-0ae1-4277-badc-131fdc47d928" }`

Response Data ```
{
"success":true,
"key":"355784bcd59fa826e980b6d2090daddc",
"url":"https://arcentry.com/app/embed.html?id=901d1e2b-0bb4-494b-ac25-4c361b4238d5&key=355784bcd59fa826e980b6d2090daddc&live=true&camera=0_0.7854_7.6667_-0.7854_0.6155_0.5236_450_450_450&hideViewControls=0"
}

````

Â©2025 Arcentry, Inc.

Arcentry, Inc.
2035 Sunset Lake Road
19702 Newark, USA

[@arcentry](https://twitter.com/arcentry) [Youtube Channel](https://www.youtube.com/channel/UCCv3ZhafMXS4E0JqmyFb72g) [info@arcentry.com](mailto:info@arcentry.com)

[Terms of Use](https://arcentry.com/assets/pdf/terms-of-use.pdf) [Privacy Policy](https://arcentry.com/assets/pdf/privacy-policy.pdf) [Cookie Policy](https://arcentry.com/assets/pdf/cookie-policy.pdf)

By continuing to use this website, you consent to the use of cookies in accordance with our [Cookie Policy](https://arcentry.com/api-docs/embed/legal/cookie-policy.pdf).
</article>

<article>
Title: Arcentry Automatic Diagram Creation

URL Source: https://arcentry.com/api-docs/create-diagram/

Markdown Content:
Arcentry's /create-diagram endpoint takes simple, flat infrastructure descriptions in JSON or CSV and automatically turns them into diagrams.

What would I use this for?
--------------------------

To easily visualize existing architectures, to document deployments and to turn infrastructure templates into diagrams.

Hold on, isn't there already an API for diagram creation?
---------------------------------------------------------

Yes, using Arcentry's /doc/<doc-id\>/\* endpoints you can already create and manipulate components on a diagram in realtime. This is useful for interacting with existing diagrams (e.g., changing colors to indicate component state), but laying out a whole infrastructure this way can be cumbersome.

What's the future of this?
--------------------------

Now that we have a robust baseline for automated diagram creation we will gradually add converters for infrastructure data - e.g., templates like Terraform or AWS Cloudformation, reading live infrastructure from AWS, Google Cloud, Azure, and Co and integrating with infrastructure discovery software. If you have any particular use case in mind, please let us know at [info@arcentry.com](mailto:info@arcentry.com).

Example
-------

![Image 1](https://arcentry.com/api-docs/create-diagram/create-diagram.png)

To generate the diagram above, POST the CSV or JSON below (with content-type: text/csv or application/json) to https://arcentry.com/api/v1/create-diagram/<docId\>.

*   Table
*   CSV
*   JSON

| id | type | componentType | groups | connections | label | backgroundColor | primaryColor | icon | iconColor | areaType |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| server-a | component | generic.server | vpn-a | db-a |  |  |  |  |  |  |
| server-b | component | generic.server | vpn-a | db-a |  |  |  |  |  |  |
| server-c | component | generic.server | vpn-b | db-b | Instance 14 |  |  |  |  |  |
| server-d | component | generic.server | vpn-b | db-b |  |  |  |  |  |  |
| server-e | component | generic.server | vpn-b | db-b |  | #202020 | #E61876 | bolt | #E61876 |  |
| db-a | component | database.postgres | vpn-c |  |  |  |  |  |  |  |
| db-b | component | database.postgres | vpn-c |  |  |  |  |  |  |  |
| cdn-a | component | networking.gcc-cloud-cdn |  | server-a, server-b, server-c, server-e |  |  |  |  |  |  |
| vpn-b | group |  |  |  | VPN-E345dd34 |  |  |  |  | 1 |

Format for Automatic Diagram Creation
-------------------------------------

Structure
---------

A flat list of components, their associated groups, connections, and other data. Each entry must have a unique id and a type. Additional fields depend on the type of the entry.

Data Format
-----------

Either CSV or JSON

Request Format
--------------

Data is sent via HTTP POST request to https://arcentry.com/api/v1/create-diagram/<docId\>. A content-type header must be set to either application/json or text/csv. As with other API requests, [authentication must be provided as either header or URL parameter](https://arcentry.com/api-docs/#getting-started).

Example Request reading data from a CSV file ```
curl \
--data-binary "@architecture.csv" \
-H "Authorization: Bearer 6b4f49e064e1537a050d06067fc6cac4342ec2e59cb43ff6b975a596331f31e9" \
-H "Content-Type: text/csv" \
-X POST \
https://arcentry.com/api/v1/create-diagram/25f2ff32-ccb3-3425-a86e-66c6c6b92a1c
``` Example Request sending data as JSON ```
curl \
-d '{"server-a":{"type":"component","componentType":"generic.server"},"server-b":{"type":"component","componentType":"generic.server"}}' \
-H "Authorization: Bearer 6b4f49e064e1537a050d06067fc6cac4342ec2e59cb43ff6b975a596331f31e9" \
-H "Content-Type: application/json" \
-X POST \
https://arcentry.com/api/v1/create-diagram/25f2ff32-ccb3-3425-a86e-66c6c6b92a1c
````

## Margins, Paddings & Co

You can add query string parameter to your URL to specify how much space you'd like between components, tiers and groups, how much paddings your labels should have and many other settings. [You can find a detailed list of available settings here.](https://arcentry.com/api-docs/create-diagram-settings/)

## Components

Components are the main building blocks of diagrams. In addition to id and type, each component must have a componentType, specifying what kind of component it is.

![Image 2: component type](https://arcentry.com/api-docs/create-diagram/component-type.png)

To find the type of a component in Arcentry, place it on the grid, select it and check the object-data box (only visible if API is activated) for componentId.

### Result

![Image 3](https://arcentry.com/api-docs/create-diagram/components.png)

- Table
- CSV
- JSON

| id       | type      | componentType  |
| -------- | --------- | -------------- |
| server-a | component | generic.server |
| server-b | component | generic.server |

## Connections

Connections specify the lines that connect components or groups with each other. Each connection field is an array of ids of other components or groups this component or group should connect to.

Please note - it's sufficient to specify connections once - e.g. if component a is connected to b, it's enough to specify connections: \['b'\] for component a.

### Result

![Image 4](https://arcentry.com/api-docs/create-diagram/connections.png)

- Table
- CSV
- JSON

| id       | type      | componentType     | connections |
| -------- | --------- | ----------------- | ----------- |
| server-a | component | generic.server    | db-a        |
| server-b | component | generic.server    | db-a,db-b   |
| db-a     | component | database.postgres |             |
| db-b     | component | database.postgres |             |

## Arrows

You can add arrowheads to the end of specific or all connections originating at a given component or group by defining the arrowsTo setting. arrowsTo can either be set to all, causing all connections from this component to end in arrows or to an array of connections, e.g. \["server-a", "server-c"\].

### Result

![Image 5](https://arcentry.com/api-docs/create-diagram/arrows.png)

- Table
- CSV
- JSON

| id     | type      | componentType     | connections | arrowsTo |
| ------ | --------- | ----------------- | ----------- | -------- |
| comp-a | component | generic.server    | db-a, db-b  | all      |
| comp-b | component | generic.server    | db-c, db-d  | db-d     |
| db-a   | component | database.postgres |             |          |
| db-b   | component | database.postgres |             |          |
| db-c   | component | database.postgres |             |          |
| db-d   | component | database.postgres |             |          |

## Groups

Groups allow you to specify areas around your components, e.g. to visualize VPN/VPCs, security zones, etc. Each component can be part of one or more groups.

Groups are defined as arrays (or comma-separated lists for CSV) of group ids. These group ids don't have to be explicit entries in the table - though adding them as entries allows you to specify labels and styling rules.

### Result

![Image 6](https://arcentry.com/api-docs/create-diagram/groups.png)

- Table
- CSV
- JSON

| id       | type      | componentType  | groups |
| -------- | --------- | -------------- | ------ |
| server-a | component | generic.server | vpn-a  |
| server-b | component | generic.server | vpn-a  |
| server-c | component | generic.server | vpn-b  |

## Nested Groups

Often, you have multiple layers of groups within your infrastructure. Say, a Virtual Private Cloud on AWS that contains multiple subnets which in turn are home to multiple components.

Arcentry makes it easy to specify this. Simple list all groups a component belongs to, separated by commas (in CSV) or as an Array (in JSON.

Important: Your list of groups must be ordered from parent to child, e.g. VPC-A, Subnet-A.

### Result

![Image 7](https://arcentry.com/api-docs/create-diagram/nested-groups.png)

- Table
- CSV
- JSON

| id     | type      | componentType  | groups          |
| ------ | --------- | -------------- | --------------- |
| comp-a | component | generic.server | vpn-a, subnet-a |
| comp-b | component | generic.server | vpn-a, subnet-a |
| comp-c | component | generic.server | vpn-a, subnet-b |
| comp-d | component | generic.server | vpn-b, subnet-c |
| comp-e | component | generic.server | vpn-b, subnet-c |

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

### Result

![Image 8](https://arcentry.com/api-docs/create-diagram/tiers.png)

- Table
- CSV
- JSON

| id       | type      | componentType  | tier |
| -------- | --------- | -------------- | ---- |
| server-a | component | generic.server | 1    |
| server-b | component | generic.server | 1    |
| server-c | component | generic.server | 2    |

## Labels

Labels can be added to components and groups. For components, simply specify label: "My label" in their definition. For groups, you'd need to create an additional entry with id:groupId and type:'group' and add the label there.

Btw, by default, Arcentry chooses a random color for groups and label backgrounds based on the name of the group. To change this, simply specify e.g. "lineColor": "#00FF00" as part of your group settings.

### Result

![Image 9](https://arcentry.com/api-docs/create-diagram/labels.png)

- Table
- CSV
- JSON

| id       | type      | componentType  | label      | groups |
| -------- | --------- | -------------- | ---------- | ------ |
| server-a | component | generic.server | instance A | vpn-a  |
| server-b | component | generic.server | instance B | vpn-a  |
| vpn-a    | group     |                | VPN A1     |        |

## Styling

Every aspect of your diagram can be styled in any way you like. You can find an extensive [](https://arcentry.com/api-docs/properties/)list of all available properties here or simply style things in Arcentry's GUI and copy the properties you like from the object-data entry in the sidebar.

To apply styles, simply add them to your CSV along with id, type, groups, and all the other properties.

### Result

![Image 10](https://arcentry.com/api-docs/create-diagram/styling.png)

- Table
- CSV
- JSON

| id       | type      | componentType  | groups | backgroundColor | primaryColor | icon | iconColor | lineColor | lineWidth | shadowLevel |
| -------- | --------- | -------------- | ------ | --------------- | ------------ | ---- | --------- | --------- | --------- | ----------- |
| server-a | component | generic.server | vpn-a  | #202020         | #31E618      | bolt | #31E618   |           |           |             |
| vpn-a    | group     |                |        |                 |              |      |           | #E64418   | 0.2       | 2           |

## Metadata

Arcentry allows you to store meta-data such as instance ids, number of cores, memory, etc. alongside any component. You can find more about metadata here.

To add metadata to your generated diagrams, simply prefix your column-names or JSON keys with meta-. (This prefix will be removed before insertion).

### Result

![Image 11](https://arcentry.com/api-docs/create-diagram/meta.png)

- Table
- CSV
- JSON

| id       | type      | componentType  | meta-instance-id | meta-cores | meta-ram |
| -------- | --------- | -------------- | ---------------- | ---------- | -------- |
| server-a | component | generic.server | I-453jdfg234     | 16         | 4GB      |

</article>

<article>Title: Arcentry Infrastructure Description Format Reference

URL Source: https://arcentry.com/api-docs/create-diagram-reference/

Markdown Content:
Common Properties

---

Every entry has to have these properties

| Property | Default  | Description                                                                                                                                                                                                                                                                        |
| -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id       | required | A unique ID for this entry - used by other entries to reference this one as e.g. a connection target. The ID specified here will be applied as a component or area id within the generated diagram, allowing for further interaction with the generated component through the API. |
| type     | required | The type for this entry. Can be "component", "group" or "connection"                                                                                                                                                                                                               |

## Component

Specifies a single component / Arcentry object

| Property           | Default  | Description                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| componentType      | required | A component id, e.g. "database.postgres", "security.aws-amazon-cognito" or "generic.server".                                                                                                                                                                                                                                                                                                                      |
| groups             | \[\]     | A list of group ids this component is a child of.                                                                                                                                                                                                                                                                                                                                                                 |
| connections        | \[\]     | A list of component or group ids this component is connected to.                                                                                                                                                                                                                                                                                                                                                  |
| label              | null     | A label to be displayed underneath this component.                                                                                                                                                                                                                                                                                                                                                                |
| opacity            | 1        | A value that determines the opacity of a component from 0 (fully transparent) to 1(fully opaque)                                                                                                                                                                                                                                                                                                                  |
| rotation           | 0        | The rotation of the component in radians (multiples of PI). E.g. 0, 1.5707963, 3.1415926, 4.712388                                                                                                                                                                                                                                                                                                                |
| positionType       | auto     | How the component should be positioned. If omitted or set to "auto" Arcentry will position the component for you. If set to "relative" the component position can be specified relative to another component, if set to "absolute" the absolute position can be specified. Any positionType other than "auto" requires positionX and positionY to be set. If set to "relative", "positionRelativeTo" is required. |
| positionRelativeTo | required | The ID of a component this component should be positioned relative to. Required if "positionType" is set to "relative".                                                                                                                                                                                                                                                                                           |
| positionX          | required | The absolute X coordinate of this component if "positionType": "absolute" or the relative X offset to the target component if "positionType": "relative".                                                                                                                                                                                                                                                         |
| positionY          | required | The absolute Y coordinate of this component if "positionType": "absolute" or the relative Y offset to the target component if "positionType": "relative".                                                                                                                                                                                                                                                         |
| positionPointX     | required | This property defines the horizontal point on a group's border a component is positioned relative to. It is only required if "positionType" is "relative" and "positionRelativeTo" points to a group. Possible values are "left", "middle" or "right".                                                                                                                                                            |
| positionPointY     | required | This property defines the vertical point on a group's border a component is positioned relative to. It is only required if "positionType" is "relative" and "positionRelativeTo" points to a group. Possible values are "top", "middle" or "bottom".                                                                                                                                                              |
| positionPointY     | required | The absolute Y coordinate of this component if "positionType": "absolute" or the relative Y offset to the target component if "positionType": "relative".                                                                                                                                                                                                                                                         |
| meta-\*            | N/A      | A meta-data entry, e.g. meta-instance-id or meta-machine-size. Any entry starting with meta- will be added to the component's meta-data. For JSON based config it is also possible to specify meta-data as map, e.g. "meta": {"some-key": "some-value"}                                                                                                                                                           |
| showMetaData       | false    | If true, meta-data will be plotted onto the diagram, subject to the property settings below. Alternatively, showOnCanvas can be used to specify a subset of meta-data to be displayed on the diagram.                                                                                                                                                                                                             |
| showOnCanvas       | all      | A comma-separated list of meta-data keys to be displayed on the diagram underneath the component. If your component has e.g. meta-cpu, meta-ram and meta-storage-size, but you only wish to display cpu and ram, specify "showOnCanvas": "cpu, ram"                                                                                                                                                               |
| showInTooltip      | all      | A comma-separated list of meta-data keys to be displayed in the context-menu/tooltip on embedded diagrams or in presentation-mode. If your component has e.g. meta-cpu, meta-ram and meta-storage-size, but you only wish to display cpu and ram, specify "showInTooltip": "cpu, ram"                                                                                                                             |
| showMetaDataKeys   | true     | If true, the keys (e.g. cpu, ram, machine size etc) are displayed as small, grey labels above the meta-data values.                                                                                                                                                                                                                                                                                               |
| metaDataFontSize   | 0.25     | The font-size for the meta-data values displayed on the diagram. Keys will be displayed at half that font-size.                                                                                                                                                                                                                                                                                                   |
| metaDataTextAlign  | "center" | Text align for meta-data displayed on the diagram. Can be "left", "center" or "right".                                                                                                                                                                                                                                                                                                                            |

## Generic / Customizable Components

In addition to the general component properties documented above, generic components can be styled using additional properties. Components supporting these properties can be recognized by ids starting with generic., e.g. generic.database or generic.server.

| Property        | Default | Description                                                                                                                                                                |
| --------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| backgroundColor | #FFFFFF | Background color for the component in hex-notation, e.g. "#FF0000".                                                                                                        |
| primaryColor    | #CCCCCC | Accent color for the component in hex-notation, e.g. "#FF0000".                                                                                                            |
| secondaryColor  | #CCCCCC | A small number of components supports accents in a secondary color in hex-notation, e.g. "#FF0000".                                                                        |
| icon            | null    | The name of an icon to be displayed on the component, e.g. "chart-bar", or "cloud". Please note: when using an image, set icon to null and specify an "imagePath" instead. |
| iconColor       | #333333 | The color for the icon, only applicable if "icon": true.                                                                                                                   |
| imagePath       | null    | Path to an image that was previously uploaded to Arcentry. If imagePath is specified, make sure that icon is set to null. "icon": true.                                    |
| imageSize       | 1       | Determines the size of the icon or image relative to the size of the component. Goes from 1 (full sized) to 0.001 (pretty much invisibly tiny).                            |

## Group

Groups can be styled in terms of appearance, style and label.

| Property             | Default                            | Description                                                                                                                                                                                                           |
| -------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| label                | null                               | A label to be displayed for the group.                                                                                                                                                                                |
| labelStyle           | "block"                            | Labels can either be displayed as "block" - large labels with a colorful background that extrude at the bottom of the group or "inline" - smaller, more flexible text that's displayed on or near the group's border. |
| lineColor            | automatic                          | The color for lines and block label backgrounds. If no color is specified, Arcentry will select a constant color by hashing the root group's ID.                                                                      |
| lineWidth            | 0.05                               | The width of the line surrounding the group.                                                                                                                                                                          |
| lineDash             | solid                              | The style of the line, can be "solid", "dashed" or "dotted".                                                                                                                                                          |
| fillColor            | #FFFFFF                            | The fill color for the main area of the group.                                                                                                                                                                        |
| areaType             | 0                                  | Determines whether to display a wall around the group to indicate a security zone. Use 0 for no wall or 1 for a wall.                                                                                                 |
| wallHeight           | 2                                  | If areaType is set to 1, this value determines the height of the wall.                                                                                                                                                |
| wallColor            | #CCCCCC                            | If areaType is set to 1, this value determines the color of the wall.                                                                                                                                                 |
| labelFontColor       | #FFFFFF (block) / #333333 (inline) | The font color for the label.                                                                                                                                                                                         |
| labelFontSize        | 0.5 (block) / 0.2 (inline)         | The font size for the label.                                                                                                                                                                                          |
| labelAlign           | right                              | Only applicable if labelStyle is inline. Possible values are "left", "center" or "right".                                                                                                                             |
| labelPosition        | bottom                             | Only applicable if labelStyle is inline. Possible values are "top" or "bottom".                                                                                                                                       |
| labelPlacementOnLine | on                                 | Only applicable if labelStyle is inline. Determines where the label is placed in relation to the line. Possible values are "above", "on" or "below".                                                                  |
| labelBold            | true                               | Toggle bold on or off.                                                                                                                                                                                                |
| labelItalic          | false                              | Toggle italic on or off.                                                                                                                                                                                              |
| labelFont            | Arcentry Font                      | The font family for the label. The specified font needs to be installed on the target system.                                                                                                                         |
| labelOutlineColor    | #FFFFFF                            | Color for the outline surrounding the label text.                                                                                                                                                                     |
| labelOutlineWidth    | 0.075                              | The width of the outline surrounding the label text.                                                                                                                                                                  |

## Connection

Arcentry allows to specify additional settings for connections. Similar to groups, the connections themselves are specified using the connections property of components and groups.

| Property   | Default  | Description                                                                                                                                                                           |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| from       | required | The ID of the component or group the connection originates from.                                                                                                                      |
| to         | required | The ID of the component or group the connection points to.                                                                                                                            |
| arrowStart | false    | Whether an arrow should point at the start element.                                                                                                                                   |
| arrowEnd   | false    | Whether an arrow should point at the target element.                                                                                                                                  |
| lineWidth  | 0.5      | The width of the line indicating the connection.                                                                                                                                      |
| lineColor  | #E61898  | The color of the line indicating the connection.                                                                                                                                      |
| lineDash   | solid    | The style of the line, can be "solid", "dashed" or "dotted".                                                                                                                          |
| component  | null     | The ID of an optional component to be displayed at the center of the longest segment of the connection - e.g. "database.postgres", "security.aws-amazon-cognito" or "generic.server". |
| label      | null     | If component is specified, this adds a label to the component.                                                                                                                        |

</article>

<article>Title: Arcentry Generate Images

URL Source: https://arcentry.com/api-docs/images/

# Image

Arcentry makes it easy to download your diagram as images from the app - and now you can do the same programmatically using these API endpoints. Even better: Using Arcentry's image/create-from-diagram endpoint you can auto-generate diagram images out of simple CSVs or JSON files without ever having to open the app.

## PNGs

All image generation endpoints return png image data. You can save the result of the request as a normal some-image.png file.

## Querystring Parameter

Both endpoints support the following query string parameter.

- **key** your API key. (Optional, [](https://arcentry.com/api-docs/#how-the-api-works)can also be provided as a Bearer Token).
- **width** the width of the desired image in pixels. (Optional, defaults to 1024)
- **height** the height of the desired image in pixels. (Optional, defaults to 768)

## Timing

Image creation can take up to 15 seconds. Please allow for sufficient request timeouts.

## Creates an image from a given document

Renders a document with a given DOC_ID and returns the result as png.

`GET https://arcentry.com/api/v1/image/from-document/_DOC_ID_`

Show example request ```
curl \
 -o my-architecture.png \
 -H "Authorization: Bearer 6b4f49e064e1534534ab7fc6cac42e5cc2e59cb43ff6b975a596331f31e9" \
 https://arcentry.com/api/v1/image/from-document/4a2432e2-1cc3-4a48-9adc-5f240bf39554?width=800&height=600

````

Auto Generate a Diagram as Image
--------------------------------

This endpoint is built on top of [Arcentry's automated diagram creation](https://arcentry.com/api-docs/create-diagram/). It allows you to upload a CSV or JSON file which Arcentry will automatically turn into a diagram, take a picture of and return this picture without any further work - isn't life awesome?
Please note - this endpoint supports all [styling options for auto-created diagrams](https://arcentry.com/api-docs/create-diagram-settings/). Simple append them as query string parameters.

`POST https://arcentry.com/api/v1/image/create-from-diagram`

Show example request ```
curl \
    -d '{"server-a":{"type":"component","componentType":"generic.server"},"server-b":{"type":"component","componentType":"generic.server"}}' \
    -o my-architecture.png \
    -H "Authorization: Bearer 6b4f49e064e1537a050d06067fc6cac42e5cc2e59cb43ff6b975a596331f31e9" \
    -H "Content-Type: application/json" \
    -X POST \
    https://arcentry.com/api/v1/image/create-from-diagram?comp_gap=4

````

</article>

<available_components>
export const ALL_DIAGRAM_COMPONENTS = [
{
id: "generic.analytics",
name: "Analytics",
},
{
id: "generic.api-gateway",
name: "API Gateway",
},
{
id: "generic.billboard",
name: "Billboard",
},
{
id: "generic.billboard-large",
name: "Billboard Large",
},
{
id: "generic.block",
name: "Block",
},
{
id: "generic.bot",
name: "Bot",
},
{
id: "generic.bucket",
name: "Bucket",
},
{
id: "generic.cache",
name: "Cache",
},
{
id: "generic.cloud",
name: "Cloud",
},
{
id: "generic.connection",
name: "Connection",
},
{
id: "generic.data-warehouse",
name: "Data Warehouse",
},
{
id: "generic.database",
name: "Database",
},
{
id: "generic.enterprise-service-bus",
name: "Enterprise Service Bus",
},
{
id: "generic.funnel",
name: "Data Processing",
},
{
id: "generic.gateway",
name: "Gateway",
},
{
id: "generic.generic-physical-data-transfer-device",
name: "Physical Data Transfer Device",
},
{
id: "generic.generic-batch-processor",
name: "Batch Processor",
},
{
id: "generic.generic-brain",
name: "Artificial Intelligence",
},
{
id: "generic.generic-cdn",
name: "CDN",
},
{
id: "generic.generic-container",
name: "Container",
},
{
id: "generic.generic-container-registry",
name: "Container Registry",
},
{
id: "generic.generic-cube",
name: "Cube",
},
{
id: "generic.generic-disk-storage",
name: "Disk Storage",
},
{
id: "generic.generic-email",
name: "Email Service",
},
{
id: "generic.generic-event-hub",
name: "EventHub",
},
{
id: "generic.generic-event-processing-engine",
name: "Event Processor",
},
{
id: "generic.generic-firewall",
name: "Firewall",
},
{
id: "generic.generic-genetics",
name: "Genetics",
},
{
id: "generic.generic-identity-provider",
name: "Identity Provider",
},
{
id: "generic.generic-keyvalue",
name: "Key-Value Store",
},
{
id: "generic.generic-loadbalancer-alt",
name: "Loadbalancer",
},
{
id: "generic.generic-logging",
name: "Log Aggregator",
},
{
id: "generic.generic-media-player",
name: "Media Player",
},
{
id: "generic.generic-message-bus",
name: "Message Bus",
},
{
id: "generic.generic-monitoring",
name: "Monitoring Solution",
},
{
id: "generic.generic-network-router",
name: "Network Router",
},
{
id: "generic.generic-network-switch",
name: "Network Switch",
},
{
id: "generic.generic-orchestrator",
name: "Orchestration Server",
},
{
id: "generic.generic-router",
name: "Router",
},
{
id: "generic.generic-scheduler",
name: "Scheduler",
},
{
id: "generic.generic-triangle",
name: "Triangle",
},
{
id: "generic.generic-vault",
name: "Safe / Vault",
},
{
id: "generic.generic-vision",
name: "Computer Vision",
},
{
id: "generic.image",
name: "Image Component",
},
{
id: "generic.loadbalancer",
name: "Loadbalancer",
},
{
id: "generic.mapreduce",
name: "Map-Reduce",
},
{
id: "generic.message-queue",
name: "Message Queue",
},
{
id: "generic.neural-net",
name: "Neural Net",
},
{
id: "generic.objectdb",
name: "Object Database",
},
{
id: "generic.pc",
name: "PC",
},
{
id: "generic.piechart",
name: "Metrics",
},
{
id: "generic.processor",
name: "Processor",
},
{
id: "generic.search",
name: "Search",
},
{
id: "generic.server",
name: "Server",
},
{
id: "generic.smartphone",
name: "Smartphone",
},
{
id: "generic.speech",
name: "Speech",
},
{
id: "generic.stream-processor",
name: "Stream Processor",
},
{
id: "generic.timeseriesdb",
name: "Timeseries DB",
},
{
id: "computation.aws-amazon-elastic-container-registry",
name: "Amazon Elastic Container Registry",
},
{
id: "computation.aws-amazon-elastic-container-service",
name: "Amazon Elastic Container Service",
},
{
id: "computation.aws-amazon-elastic-container-service-for-kubernetes",
name: "Amazon Elastic Container Service for Kubernetes",
},
{
id: "computation.aws-batch",
name: "AWS Batch",
},
{
id: "computation.aws-ec2",
name: "AWS Elastic Compute Cloud",
},
{
id: "computation.aws-fargate",
name: "AWS Fargate",
},
{
id: "computation.aws-lambda",
name: "AWS Lambda",
},
{
id: "computation.aws-step-functions",
name: "AWS Step Functions",
},
{
id: "computation.aws-vmware-cloud-on-aws",
name: "VMware Cloud on AWS",
},
{
id: "computation.azure-batch",
name: "Azure Batch",
},
{
id: "computation.azure-container-instances",
name: "Azure Container Instances",
},
{
id: "computation.azure-functions",
name: "Azure Functions",
},
{
id: "computation.azure-kubernetes-service-(aks)",
name: "Azure Kubernetes Service (AKS)",
},
{
id: "computation.azure-linux-virtual-machines",
name: "Azure Linux Virtual Machines",
},
{
id: "computation.azure-sap-hana-on-azure-large-instances",
name: "Azure SAP HANA on Azure Large Instances",
},
{
id: "computation.azure-sql-server-on-virtual-machines",
name: "Azure SQL Server on Virtual Machines",
},
{
id: "computation.azure-virtual-machines",
name: "Azure Virtual Machines",
},
{
id: "computation.gcc-app-engine",
name: "GCC App Engine",
},
{
id: "computation.gcc-cloud-functions",
name: "GCC Cloud Functions",
},
{
id: "computation.gcc-compute-engine",
name: "GCC Compute Engine",
},
{
id: "computation.gcc-kubernetes-engine",
name: "GCC Kubernetes Engine",
},
{
id: "container.azure-container-registry",
name: "Azure Container Registry",
},
{
id: "container.docker",
name: "Docker Container",
},
{
id: "container.gcc-container-builder",
name: "GCC Container Builder",
},
{
id: "container.gcc-container-registry",
name: "GCC Container Registry",
},
{
id: "container.hashicorp-packer",
name: "HashiCorp Packer",
},
{
id: "container.kubernetes",
name: "Kubernetes",
},
{
id: "database.algolia",
name: "Algolia",
},
{
id: "database.apache-cassandra",
name: "Apache Cassandra",
},
{
id: "database.arango-db",
name: "ArangoDB",
},
{
id: "database.aws-amazon-aurora",
name: "Amazon Aurora",
},
{
id: "database.aws-amazon-rds",
name: "Amazon RDS",
},
{
id: "database.aws-dynamodb",
name: "AWS DynamoDB",
},
{
id: "database.azure-cosmos-db",
name: "Azure Cosmos DB",
},
{
id: "database.azure-sql-data-warehouse",
name: "Azure SQL Data Warehouse",
},
{
id: "database.azure-sql-database",
name: "Azure SQL Database",
},
{
id: "database.azure-table-storage",
name: "Azure Table Storage",
},
{
id: "database.cockroach-db",
name: "CockroachDB",
},
{
id: "database.couch-db",
name: "Apache CouchDB",
},
{
id: "database.couchbase",
name: "Couchbase",
},
{
id: "database.crate-db",
name: "CrateDB",
},
{
id: "database.elastic-search",
name: "Elastic Search",
},
{
id: "database.etcd",
name: "etcd",
},
{
id: "database.gcc-bigquery",
name: "GCC BigQuery",
},
{
id: "database.gcc-cloud-bigtable",
name: "GCC Cloud Bigtable",
},
{
id: "database.gcc-cloud-datastore",
name: "GCC Cloud Datastore",
},
{
id: "database.gcc-cloud-spanner",
name: "GCC Cloud Spanner",
},
{
id: "database.gcc-cloud-sql",
name: "GCC Cloud SQL",
},
{
id: "database.gcc-firebase-realtime-database",
name: "GCC Firebase Realtime Database",
},
{
id: "database.graphite",
name: "Graphite",
},
{
id: "database.ibm-db2",
name: "IBM Db2 Database",
},
{
id: "database.influxdb",
name: "InfluxDB",
},
{
id: "database.ingres-db",
name: "Ingres",
},
{
id: "database.maria-db",
name: "MariaDB",
},
{
id: "database.microsoft-access",
name: "Microsoft Access",
},
{
id: "database.microsoft-sql-server",
name: "Microsoft SQL Server",
},
{
id: "database.mongodb",
name: "MongoDB",
},
{
id: "database.mysql",
name: "MySQL",
},
{
id: "database.neo4j",
name: "Neo4j",
},
{
id: "database.oracle-db",
name: "Oracle Database",
},
{
id: "database.orient-db",
name: "OrientDB",
},
{
id: "database.postgres",
name: "PostgreSQL",
},
{
id: "database.prometheus",
name: "Prometheus",
},
{
id: "database.realm",
name: "Realm",
},
{
id: "database.rethink-db",
name: "RethinkDB",
},
{
id: "database.riak",
name: "Riak",
},
{
id: "database.sqlite",
name: "SQLite",
},
{
id: "database.teradata-db",
name: "Teradata Database",
},
{
id: "devops.hashicorp-consul",
name: "HashiCorp Consul",
},
{
id: "devops.hashicorp-nomad",
name: "HashiCorp Nomad",
},
{
id: "networking.aws-amazon-cloudfront",
name: "Amazon CloudFront",
},
{
id: "networking.aws-amazon-route-53",
name: "Amazon Route 53",
},
{
id: "networking.aws-api-gateway",
name: "AWS API Gateway",
},
{
id: "networking.aws-direct-connect",
name: "AWS Direct Connect",
},
{
id: "networking.aws-elastic-loadbalancer",
name: "AWS Elastic Loadbalancer",
},
{
id: "networking.azure-api-management",
name: "Azure API Management",
},
{
id: "networking.azure-application-gateway",
name: "Azure Application Gateway",
},
{
id: "networking.azure-content-delivery-network",
name: "Azure Content Delivery Network",
},
{
id: "networking.azure-ddos-protection",
name: "Azure DDoS Protection",
},
{
id: "networking.azure-dns",
name: "Azure DNS",
},
{
id: "networking.azure-expressroute",
name: "Azure ExpressRoute",
},
{
id: "networking.azure-load-balancer",
name: "Azure Load Balancer",
},
{
id: "networking.azure-traffic-manager",
name: "Azure Traffic Manager",
},
{
id: "networking.azure-virtual-network",
name: "Azure Virtual Network",
},
{
id: "networking.azure-vpn-gateway",
name: "Azure VPN Gateway",
},
{
id: "networking.gcc-bigquery-data-transfer-service",
name: "GCC BigQuery Data Transfer Service",
},
{
id: "networking.gcc-cloud-armor",
name: "GCC Cloud Armor",
},
{
id: "networking.gcc-cloud-cdn",
name: "GCC Cloud CDN",
},
{
id: "networking.gcc-cloud-dns",
name: "GCC Cloud DNS",
},
{
id: "networking.gcc-cloud-endpoints",
name: "GCC Cloud Endpoints",
},
{
id: "networking.gcc-cloud-interconnect",
name: "GCC Cloud Interconnect",
},
{
id: "networking.gcc-cloud-load-balancing",
name: "GCC Cloud Load Balancing",
},
{
id: "networking.gcc-cloud-storage-transfer-service",
name: "GCC Cloud Storage Transfer Service",
},
{
id: "networking.gcc-transfer-appliance",
name: "GCC Transfer Appliance",
},
{
id: "networking.haproxy",
name: "HA Proxy",
},
{
id: "networking.ibm-websphere-application-server",
name: "IBM WebSphere Application Server",
},
{
id: "networking.ibm-websphere-http-server",
name: "IBM WebSphere HTTP Server",
},
{
id: "networking.nginx",
name: "NginX",
},
{
id: "ai.aws-amazon-comprehend",
name: "Amazon Comprehend",
},
{
id: "ai.aws-amazon-lex",
name: "Amazon Lex",
},
{
id: "ai.aws-amazon-machine-learning",
name: "Amazon Machine Learning",
},
{
id: "ai.aws-amazon-pinpoint",
name: "Amazon Pinpoint",
},
{
id: "ai.aws-amazon-polly",
name: "Amazon Polly",
},
{
id: "ai.aws-amazon-rekognition",
name: "Amazon Rekognition",
},
{
id: "ai.aws-amazon-sagemaker",
name: "Amazon SageMaker",
},
{
id: "ai.aws-amazon-transcribe",
name: "Amazon Transcribe",
},
{
id: "ai.aws-amazon-translate",
name: "Amazon Translate",
},
{
id: "ai.aws-apache-mxnet-on-aws",
name: "Apache MXNet on AWS",
},
{
id: "ai.aws-deep-learning-amis",
name: "AWS Deep Learning AMIs",
},
{
id: "ai.azure-batch-ai",
name: "Azure Batch AI",
},
{
id: "ai.azure-bing-speech",
name: "Azure Bing Speech",
},
{
id: "ai.azure-bot-service",
name: "Azure Bot Service",
},
{
id: "ai.azure-computer-vision",
name: "Azure Computer Vision",
},
{
id: "ai.azure-content-moderator",
name: "Azure Content Moderator",
},
{
id: "ai.azure-custom-decision",
name: "Azure Custom Decision",
},
{
id: "ai.azure-custom-speech",
name: "Azure Custom Speech",
},
{
id: "ai.azure-custom-vision",
name: "Azure Custom Vision",
},
{
id: "ai.azure-emotion",
name: "Azure Emotion",
},
{
id: "ai.azure-face",
name: "Azure Face",
},
{
id: "ai.azure-language-understanding",
name: "Azure Language Understanding",
},
{
id: "ai.azure-linguistic-analysis",
name: "Azure Linguistic Analysis",
},
{
id: "ai.azure-qna-maker",
name: "Azure QnA Maker",
},
{
id: "ai.azure-search",
name: "Azure Search",
},
{
id: "ai.azure-speaker-recognition",
name: "Azure Speaker Recognition",
},
{
id: "ai.azure-text-analytics",
name: "Azure Text Analytics",
},
{
id: "ai.azure-translator-speech",
name: "Azure Translator Speech",
},
{
id: "ai.azure-translator-text",
name: "Azure Translator Text",
},
{
id: "ai.azure-video-indexer",
name: "Azure Video Indexer",
},
{
id: "ai.azure-web-language-model",
name: "Azure Web Language Model",
},
{
id: "ai.gcc-cloud-automl",
name: "GCC Cloud AutoML",
},
{
id: "ai.gcc-cloud-machine-learning-engine",
name: "GCC Cloud Machine Learning Engine",
},
{
id: "ai.gcc-cloud-natural-language",
name: "GCC Cloud Natural Language",
},
{
id: "ai.gcc-cloud-speech-to-text",
name: "GCC Cloud Speech-to-Text",
},
{
id: "ai.gcc-cloud-text-to-speech",
name: "GCC Cloud Text-to-Speech",
},
{
id: "ai.gcc-cloud-translation-api",
name: "GCC Cloud Translation API",
},
{
id: "ai.gcc-cloud-video-intelligence",
name: "GCC Cloud Video Intelligence",
},
{
id: "ai.gcc-cloud-vision-api",
name: "GCC Cloud Vision API",
},
{
id: "ai.gcc-dialogflow-enterprise-edition",
name: "GCC Dialogflow Enterprise Edition",
},
{
id: "ai.gcc-firebase-predictions",
name: "GCC Firebase Predictions",
},
{
id: "ai.tensorflow",
name: "TensorFlow",
},
{
id: "analytics.aws-athena",
name: "AWS Athena",
},
{
id: "analytics.aws-cloudtrail",
name: "AWS CloudTrail",
},
{
id: "analytics.aws-data-pipeline",
name: "AWS Data Pipeline",
},
{
id: "analytics.aws-glue",
name: "AWS Glue",
},
{
id: "analytics.aws-quicksight",
name: "AWS Quicksight",
},
{
id: "analytics.azure-analysis-services",
name: "Azure Analysis Services",
},
{
id: "analytics.azure-apache-spark-for-azure-hdinsight",
name: "Azure Apache Spark for Azure HDInsight",
},
{
id: "analytics.azure-apache-storm-for-hdinsight",
name: "Azure Apache Storm for HDInsight",
},
{
id: "analytics.azure-data-factory",
name: "Azure Data Factory",
},
{
id: "analytics.azure-data-lake-analytics",
name: "Azure Data Lake Analytics",
},
{
id: "analytics.azure-data-lake-storage",
name: "Azure Data Lake Storage",
},
{
id: "analytics.azure-databricks",
name: "Azure Databricks",
},
{
id: "analytics.azure-event-hubs",
name: "Azure Event Hubs",
},
{
id: "analytics.azure-power-bi-embedded",
name: "Azure Power BI Embedded",
},
{
id: "analytics.azure-r-server-for-hdinsight",
name: "Azure R Server for HDInsight",
},
{
id: "analytics.azure-stream-analytics",
name: "Azure Stream analytics",
},
{
id: "analytics.cloud-search",
name: "AWS Cloudsearch",
},
{
id: "analytics.gcc-genomics",
name: "GCC Genomics",
},
{
id: "analytics.microsoft-genomics",
name: "Microsoft Genomics",
},
{
id: "cache.aerospike",
name: "Aerospike",
},
{
id: "cache.apache-geode",
name: "Apache Geode",
},
{
id: "cache.aws-elasticache",
name: "AWS ElastiCache",
},
{
id: "cache.azure-redis-cache",
name: "Azure Redis Cache",
},
{
id: "cache.ibm-websphere-extreme-scale",
name: "IBM WebSphere eXtreme Scale",
},
{
id: "cache.memcached",
name: "Memcached",
},
{
id: "cache.redis",
name: "Redis",
},
{
id: "cache.sap-hana",
name: "SAP HANA",
},
{
id: "data-processing.apache-flink",
name: "Apache Flink",
},
{
id: "data-processing.apache-spark",
name: "Apache Spark",
},
{
id: "data-processing.aws-emr",
name: "AWS Elastic Map Reduce (EMR)",
},
{
id: "data-processing.aws-macie",
name: "AWS Macie",
},
{
id: "data-processing.gcc-cloud-dataflow",
name: "GCC Cloud Dataflow",
},
{
id: "data-processing.gcc-cloud-dataprep",
name: "GCC Cloud Dataprep",
},
{
id: "data-processing.gcc-cloud-dataproc",
name: "GCC Cloud Dataproc",
},
{
id: "data-processing.ibm-business-events",
name: "IBM Websphere Business Events",
},
{
id: "monitoring.aws-amazon-cloudwatch",
name: "Amazon CloudWatch",
},
{
id: "monitoring.aws-systems-manager",
name: "AWS Systems Manager",
},
{
id: "monitoring.azure-log-analytics",
name: "Azure Log Analytics",
},
{
id: "monitoring.azure-monitor",
name: "Azure Monitor",
},
{
id: "monitoring.azure-network-watcher",
name: "Azure Network Watcher",
},
{
id: "monitoring.gcc-cloud-deployment-manager",
name: "GCC Cloud Deployment Manager",
},
{
id: "monitoring.gcc-debugger",
name: "GCC Debugger",
},
{
id: "monitoring.gcc-error-reporting",
name: "GCC Error Reporting",
},
{
id: "monitoring.gcc-firebase-performance-monitoring",
name: "GCC Firebase Performance Monitoring",
},
{
id: "monitoring.gcc-logging",
name: "GCC Logging",
},
{
id: "monitoring.gcc-monitoring",
name: "GCC Monitoring",
},
{
id: "monitoring.gcc-trace",
name: "GCC Trace",
},
{
id: "monitoring.kibana",
name: "Kibana",
},
{
id: "media.aws-amazon-elastic-transcoder",
name: "Amazon Elastic Transcoder",
},
{
id: "media.aws-amazon-kinesis-video-streams",
name: "Amazon Kinesis Video Streams",
},
{
id: "media.aws-elemental-mediaconvert",
name: "AWS Elemental MediaConvert",
},
{
id: "media.aws-elemental-medialive",
name: "AWS Elemental MediaLive",
},
{
id: "media.aws-elemental-mediapackage",
name: "AWS Elemental MediaPackage",
},
{
id: "media.aws-elemental-mediastore",
name: "AWS Elemental MediaStore",
},
{
id: "media.aws-elemental-mediatailor",
name: "AWS Elemental MediaTailor",
},
{
id: "media.azure-content-protection",
name: "Azure Content Protection",
},
{
id: "media.azure-encoding",
name: "Azure Encoding",
},
{
id: "media.azure-live-and-on-demand-streaming",
name: "Azure Live and On-Demand Streaming",
},
{
id: "media.azure-media-analytics",
name: "Azure Media Analytics",
},
{
id: "media.azure-media-player",
name: "Azure Media Player",
},
{
id: "media.gcc-anvato",
name: "GCC Anvato",
},
{
id: "security.aws-amazon-cloud-directory",
name: "Amazon Cloud Directory",
},
{
id: "security.aws-amazon-cognito",
name: "Amazon Cognito",
},
{
id: "security.aws-amazon-guardduty",
name: "Amazon GuardDuty",
},
{
id: "security.aws-certificate-manager",
name: "AWS Certificate Manager",
},
{
id: "security.aws-cloudhsm",
name: "AWS CloudHSM",
},
{
id: "security.aws-directory-service",
name: "AWS Directory Service",
},
{
id: "security.aws-identity-&-access-management",
name: "AWS Identity & Access Management",
},
{
id: "security.aws-key-management-service",
name: "AWS Key Management Service",
},
{
id: "security.aws-secret-manager",
name: "AWS Secret Manager",
},
{
id: "security.aws-shield",
name: "AWS Shield",
},
{
id: "security.aws-waf",
name: "AWS WAF",
},
{
id: "security.azure-active-directory",
name: "Azure Active Directory",
},
{
id: "security.azure-key-vault",
name: "Azure Key Vault",
},
{
id: "security.gcc-cloud-data-loss-prevention-api",
name: "GCC Cloud Data Loss Prevention API",
},
{
id: "security.gcc-cloud-iam",
name: "GCC Cloud IAM",
},
{
id: "security.gcc-cloud-identity-aware-proxy",
name: "GCC Cloud Identity-Aware Proxy",
},
{
id: "security.gcc-cloud-key-management-service",
name: "GCC Cloud Key Management Service",
},
{
id: "security.gcc-firebase-authentication",
name: "GCC Firebase Authentication",
},
{
id: "security.gcc-security-key-enforcement",
name: "GCC Security Key Enforcement",
},
{
id: "security.hashicorp-vault",
name: "HashiCorp Vault",
},
{
id: "security.opn-sense-firewall",
name: "OpnSense Firewall",
},
{
id: "storage.aws-amazon-ebs",
name: "Amazon EBS",
},
{
id: "storage.aws-amazon-elastic-file-system",
name: "Amazon Elastic File System",
},
{
id: "storage.aws-appsync",
name: "AWS AppSync",
},
{
id: "storage.aws-ebs",
name: "Amazon Elastic Block Store (EBS)",
},
{
id: "storage.aws-glacier",
name: "AWS Glacier",
},
{
id: "storage.aws-redshift",
name: "AWS Redshift",
},
{
id: "storage.aws-s3",
name: "AWS S3 Bucket",
},
{
id: "storage.aws-snowball",
name: "AWS Snowball",
},
{
id: "storage.aws-snowmobile",
name: "AWS Snowmobile",
},
{
id: "storage.aws-storage-gateway",
name: "AWS Storage Gateway",
},
{
id: "storage.azure-archive-storage",
name: "Azure Archive Storage",
},
{
id: "storage.azure-blob-storage",
name: "Azure Blob Storage",
},
{
id: "storage.azure-data-box",
name: "Azure Data Box",
},
{
id: "storage.azure-disk-storage",
name: "Azure Disk Storage",
},
{
id: "storage.azure-file-storage",
name: "Azure File Storage",
},
{
id: "storage.azure-managed-disks",
name: "Azure Managed Disks",
},
{
id: "storage.azure-queue-storage",
name: "Azure Queue Storage",
},
{
id: "storage.azure-storsimple",
name: "Azure StorSimple",
},
{
id: "storage.gcc-cloud-filestore",
name: "GCC Cloud Filestore",
},
{
id: "storage.gcc-cloud-firestore",
name: "GCC Cloud Firestore",
},
{
id: "storage.gcc-cloud-memorystore",
name: "GCC Cloud Memorystore",
},
{
id: "storage.gcc-cloud-storage",
name: "GCC Cloud Storage",
},
{
id: "storage.gcc-cloud-storage-for-firebase",
name: "GCC Cloud Storage for Firebase",
},
{
id: "storage.gcc-persistent-disk",
name: "GCC Persistent Disk",
},
{
id: "messaging.activemq",
name: "ActiveMQ",
},
{
id: "messaging.amazon-sqs",
name: "Amazon Simple Queue Service (SQS)",
},
{
id: "messaging.apache-kafka",
name: "Apache Kafka",
},
{
id: "messaging.apache-qpid",
name: "Apache Qpid",
},
{
id: "messaging.apollo",
name: "Apollo",
},
{
id: "messaging.aws-amazon-simple-notification-service-(sns)",
name: "Amazon Simple Notification Service (SNS)",
},
{
id: "messaging.aws-kinesis",
name: "AWS Kinesis",
},
{
id: "messaging.aws-simple-email-service",
name: "Amazon Simple Email Service (SES)",
},
{
id: "messaging.azure-event-grid",
name: "Azure Event Grid",
},
{
id: "messaging.azure-notification-hubs",
name: "Azure Notification Hubs",
},
{
id: "messaging.azure-service-bus",
name: "Azure Service Bus",
},
{
id: "messaging.azure-signalr-service",
name: "Azure SignalR Service",
},
{
id: "messaging.deepstream",
name: "deepstream.io",
},
{
id: "messaging.gcc-cloud-pub-sub",
name: "GCC Cloud Pub/Sub",
},
{
id: "messaging.hornetq",
name: "HornetQ",
},
{
id: "messaging.ibm-mq",
name: "IBM MQ",
},
{
id: "messaging.ibm-websphere-message-broker",
name: "IBM WebSphere Message Broker",
},
{
id: "messaging.mule-esb",
name: "Mule Enterprise Service Bus",
},
{
id: "messaging.nats",
name: "NATS",
},
{
id: "messaging.oracle-golden-gate",
name: "Oracle Golden Gate",
},
{
id: "messaging.rabbitmq",
name: "RabbitMQ",
},
{
id: "messaging.tibco-messaging",
name: "TIBCO Enterprise Message ServiceTibco Messaging",
},
{
id: "messaging.zeromq",
name: "ZeroMQ",
},
{
id: "iot.aws-alexa",
name: "AWS Alexa",
},
{
id: "iot.aws-iot-analytics",
name: "AWS IoT Analytics",
},
{
id: "iot.aws-iot-core",
name: "AWS IoT Core",
},
{
id: "iot.aws-iot-device-defender",
name: "AWS IoT Device Defender",
},
{
id: "iot.azure-sphere",
name: "Azure Sphere",
},
{
id: "iot.azure-time-series-insights",
name: "Azure Time Series Insights",
},
{
id: "iot.gcc-cloud-iot-core",
name: "GCC Cloud IoT Core",
},
{
id: "iot.gcc-google-beacon-platform",
name: "GCC Google Beacon Platform",
},
{
id: "api.gcc-apigee-api-platform",
name: "GCC Apigee API Platform",
},
{
id: "api.gcc-apigee-healthcare-apix",
name: "GCC Apigee Healthcare APIx",
},
{
id: "api.gcc-apigee-open-banking-apix",
name: "GCC Apigee Open Banking APIx",
},
{
id: "api.gcc-apigee-sense",
name: "GCC Apigee Sense",
},
{
id: "api.trello",
name: "Trello",
},
];

</available_components>
