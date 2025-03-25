const API_KEY =
  "7e67b962c540885c25a549548f8fb6dc8dd671a7412ea4b53e1676e83c2f31d0"; // process.env.ARCENTRY_API_KEY;
import fs from "fs/promises";
/**
 * Generates an Arcentry diagram for the hardcoded Mermaid diagram
 * @param diagramId The ID of the Arcentry diagram to create/update
 * @returns A promise resolving to the API response
 */
export const generateDiagram = async (
  diagramId: string,
  description: string
) => {
  //   let docs = await fs.readFile(
  //     "./api/aiEngineer/3dDiagrams/auto-diagram.md",
  //     "utf-8"
  //   );
  //   console.log("🚀 | docs:", docs);
  //   let componentTypes = ALL_DIAGRAM_COMPONENTS;
  //   let systemPrompt = createSystemPrompt(docs, componentTypes);
  //   console.log("🚀 | systemPrompt:", systemPrompt);

  //   let llm = getLLM(modelProviders.anthropic("claude-3-7-sonnet-20250219"));
  //   let result = await llm.generateText({
  //     temperature: 0.25,
  //     providerOptions: {
  //       anthropic: {
  //         thinking: { type: "enabled", budgetTokens: 2000 },
  //       },
  //     },
  //     messages: [
  //       {
  //         role: "system",
  //         content: systemPrompt,
  //         providerOptions: {
  //           anthropic: { cacheControl: { type: "ephemeral" } },
  //         },
  //       },
  //       {
  //         role: "user",
  //         content: `We want to diagram the following:
  // ${description}

  // IMPORTANT! Only use valid componentType ids!

  // Please response in the form of:
  // <json>
  // VALID DIAGRAM JSON HERE
  // </json>
  // `,
  //       },
  //     ],
  //   });

  //   console.log("🚀 | result:", result.text);
  //   let generatedJson = result.text.match(/<json>([\s\S]*?)<\/json>/)?.[1];
  //   if (!generatedJson) {
  //     throw new Error("No JSON string found in response");
  //   }
  //   let diagram = JSON.parse(generatedJson);
  //   await fs.writeFile(
  //     "./api/aiEngineer/3dDiagrams/auto-diagram.json",
  //     generatedJson
  //   );

  // Call the Arcentry API to create the diagram
  let fileJsonStr = await fs.readFile(
    "./api/aiEngineer/3dDiagrams/auto-diagram.json",
    "utf-8"
  );
  const response = await fetch(
    `https://arcentry.com/api/v1/create-diagram/${diagramId}?GROUP_PADDING=2&LABEL_PADDING=1&COMP_GAP=3`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: fileJsonStr,
    }
  );

  console.log("🚀 | response:", response.status, response.statusText);
  if (!response.ok) {
    const errorData = await response.text();
    console.log("🚀 | errorData:", errorData);
    throw new Error(
      `Failed to create Arcentry diagram: ${JSON.stringify(errorData)}`
    );
  }

  return await response.json();
};

const CORNERSTONE = `You are highly skilled Software Architect. You're job is to create a JSON representation of a software system architecture diagram.

<guidelines>
- First think about which components are needed to build the diagram.
- Then think about which groups each components should be in.
- Then think about which connections each component should have.
- IMPORTANT!: A componentType MUST be a valid component type! This is critical! We will pass a long list of valid component types to you. and you must only choose from those.
- respond in the form of <json>VALID DIAGRAM JSON HERE</json>
</guidelines>


`;
const createSystemPrompt = (
  documentation: string,
  componentTypes: string[]
) => `${CORNERSTONE}

<documentation>
${documentation}
</documentation>

<componentTypes>
${componentTypes.map((type) => `- ${type}`).join("\n")}
</componentTypes>


<diagram_guidelines>
<tiers>
Make sure to set the Tiers on each group and component to orient it front to back
Tier 6 (all the way to the back): ai, analytics & storage
Tier 5: databases
Tier 4: data-processing, monitoring, devops
Tier 3: media processing and message broker
Tier 2: server instances, container, computation and caching
Tier 1 (Front of Web Stack): security, api, networking
Tier 0 (In Front): IoT, Client Devices
</tiers>

<groups>
- areaType of 1 means there will be a wall around the components and sub groups.
- areaType of 0 means there will be no wall around the components and sub groups.
- Use this to represent network/security boundaries.
- Ex: For groups that represent a top level container like "Azure Cloud" or "AWS Cloud" set the areaType to 1
- Ex: For groups that represent a network/security boundary like "Firewall" or "VPN" set the areaType to 1
- Ex: For Client Devices like "Mobile App" or "Web Browser" set the areaType to 0
</groups>
</diagram_guidelines>
`;
