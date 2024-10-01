import { ConversationDbItem } from "@shared/db.schema";
import { z } from "zod";
import { getDb } from "./pglite/pglite.server";

const saveConversation = async (
  input: Omit<z.infer<typeof ConversationDbItem>, "created_at" | "updated_at">
) => {
  try {
    const { rows } = await getDb().query(
      `
      INSERT INTO conversations (id, title, messages, project_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE
      SET title = EXCLUDED.title,
          messages = EXCLUDED.messages,
          updated_at = NOW()
      RETURNING *
    `,
      [input.id, input.title, JSON.stringify(input.messages), input.project_id]
    );
    return ConversationDbItem.parse(rows[0]);
  } catch (error) {
    console.error("Error saving conversation:", error);
    throw new Error("Failed to save conversation in database");
  }
};

const getConversationsByProject = async (projectId: string) => {
  try {
    const { rows } = await getDb().query(
      `
      SELECT id, title, project_id, created_at, updated_at
      FROM conversations
      WHERE project_id = $1
      ORDER BY updated_at DESC
    `,
      [projectId]
    );
    return z.array(ConversationDbItem.omit({ messages: true })).parse(rows);
  } catch (error) {
    console.error("Error getting conversations by project:", error);
    throw new Error("Failed to get conversations from database");
  }
};

const getConversation = async (conversationId: string) => {
  try {
    const { rows } = await getDb().query(
      "SELECT * FROM conversations WHERE id = $1",
      [conversationId]
    );
    if (rows.length === 0) {
      return null;
    }
    return ConversationDbItem.parse(rows[0]);
  } catch (error) {
    console.error("Error getting conversation:", error);
    throw new Error("Failed to get conversation from database");
  }
};

const deleteConversation = async (conversationId: string) => {
  try {
    await getDb().query("DELETE FROM conversations WHERE id = $1", [
      conversationId,
    ]);
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw new Error("Failed to delete conversation from database");
  }
};

export const conversationsDb = {
  saveConversation,
  getConversationsByProject,
  getConversation,
  deleteConversation,
};
