import { db } from "api/aiEngineer/db/db.server";

export const deleteConversation = async (
  projectId: string,
  conversationId: string
) => {
  try {
    await db.deleteConversation(conversationId);
  } catch (error) {
    console.error("Error in deleteConversation:", error);
    throw new Error("Failed to delete conversation");
  }
};
