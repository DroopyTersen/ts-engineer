import { db } from "../../db/db.server";

export const getConversations = async (projectId: string) => {
  try {
    const conversations = await db.getConversationsByProject(projectId);
    return conversations;
  } catch (error) {
    console.error("Error in getConversations:", error);
    throw new Error("Failed to retrieve conversations");
  }
};
