import { FileDbItem, FileSearchResultItem } from "@shared/db.schema";
import { z } from "zod";
import { embedTexts } from "~/toolkit/ai/openai/openai.sdk";
import { AsyncReturnType } from "~/toolkit/utils/typescript.utils";
import { getDb } from "./pglite/pglite.server";

export type SearchFilesCriteria = {
  query: string;
  projectId?: string;
  filepath?: string;
  extension?: string;
  limit?: number;
};

export type SearchFilesResponse = AsyncReturnType<typeof searchFiles>;
/** Hybrid search for files by embedding and keyword */
const searchFiles = async (criteria: SearchFilesCriteria) => {
  let [embeddingResults, keywordResults] = await Promise.all([
    searchFilesWithEmbedding(criteria),
    searchFilesByKeyword(criteria),
  ]);
  let rankedIds = rankFusion(
    embeddingResults.map((r) => r.id + ""),
    keywordResults.map((r) => r.id + "")
  );
  let fusedResults = rankedIds.map((id) => {
    return (
      embeddingResults.find((r) => r.id + "" === id) ||
      keywordResults.find((r) => r.id + "" === id)
    );
  });

  return {
    criteria,
    results: fusedResults,
    embeddingResults,
    keywordResults,
  };
};

const getFileByFilepath = async (projectId: string, filepath: string) => {
  projectId = projectId.toUpperCase();
  const { rows } = await getDb().query(
    "SELECT * FROM files WHERE project_id = $1 AND filepath = $2",
    [projectId, filepath]
  );
  try {
    return rows?.[0] ? FileDbItem.parse(rows?.[0]) : null;
  } catch (err) {
    console.log("🚀 | getFileByFilepath | err:", err, projectId, filepath);
    return null;
  }
};

/** Search files by embedding */
async function searchFilesWithEmbedding(criteria: SearchFilesCriteria) {
  // Generate the embedding for the given text
  const embedding = await embedTexts([criteria.query]);

  // Convert the embedding array to a string format suitable for SQL
  const embeddingStr = `'[${embedding.join(",")}]'::vector(1024)`;

  // Construct the SQL query with optional metadata filters
  const query = `
    SELECT *
    FROM search_files_with_embedding(
      ${embeddingStr},
      ${criteria.limit || 10},
      ${criteria?.projectId ? `'${criteria.projectId}'` : "NULL"},
      ${criteria?.filepath ? `'${criteria.filepath}'` : "NULL"},
      ${criteria?.extension ? `'${criteria.extension}'` : "NULL"}
    );
  `;

  // Execute the query
  const { rows } = await getDb().query(query);
  return z.array(FileSearchResultItem).parse(rows);
}

/** Search files by keyword */
async function searchFilesByKeyword(criteria: SearchFilesCriteria) {
  try {
    // Function to execute the search query
    const executeSearch = async (searchQuery: string) => {
      const query = `
        SELECT *
        FROM search_files($1, $2, $3, $4, $5);
      `;
      const params = [
        searchQuery,
        criteria.limit || 10,
        criteria?.projectId || null,
        criteria?.filepath || null,
        criteria?.extension || null,
      ];
      return await getDb().query(query, params);
    };

    // Attempt exact match first
    const exactMatchQuery = criteria.query.includes('"')
      ? criteria.query
      : `"${criteria.query}" `;
    let { rows } = await executeSearch(exactMatchQuery);
    console.log("🚀 | searchFilesByKeyword | rows:", rows);

    // If no results, fall back to regular search
    if (rows.length === 0) {
      ({ rows } = await executeSearch(criteria.query));
    }

    return z.array(FileSearchResultItem).parse(rows);
    // Note: We no longer need to manually create the snippet here
    // as it's now provided by the SQL function
  } catch (error) {
    console.error("Error in keyword search:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return [];
  }
}

function rankFusion(
  resultIdsA: Array<string>,
  resultIdsB: Array<string>
): Array<string> {
  // Helper function to calculate scores
  const calculateScores = (array: Array<string>) => {
    const scores: Record<string, number> = {};
    array.forEach((id, index) => {
      scores[id] = (array.length - index) / array.length;
    });
    return scores;
  };

  // Calculate scores for both arrays
  const scoresA = calculateScores(resultIdsA);
  const scoresB = calculateScores(resultIdsB);

  // Combine scores
  const combinedScores: Record<string, number> = {};
  for (const id of Object.keys(scoresA)) {
    combinedScores[id] = scoresA[id];
  }
  for (const [id, score] of Object.entries(scoresB)) {
    if (combinedScores.hasOwnProperty(id)) {
      combinedScores[id] += score;
    } else {
      combinedScores[id] = score;
    }
  }

  // Convert combinedScores to an array and sort by score
  const sortedResults = Object.entries(combinedScores)
    .sort((a, b) => b[1] - a[1]) // Sort by score in descending order
    .map(([id, _]) => id); // Extract the IDs

  return sortedResults;
}

/** Delete all files associated with a project */
async function deleteProjectFiles(projectId: string) {
  // Construct the SQL query to delete files for the given project ID
  const query = `
    DELETE FROM files
    WHERE project_id = $1
    RETURNING id;
  `;

  try {
    // Execute the query
    const { rows } = await getDb().query(query, [projectId]);

    // Return the number of deleted files
    return rows.length;
  } catch (error) {
    console.error("Error deleting project files:", error);
    throw new Error("Failed to delete project files from database");
  }
}

// Input schema for saveProjectFile
const SaveProjectFileInput = z.object({
  projectId: z.string(),
  filepath: z.string(),
  content: z.string(),
  summary: z.string().optional(),
  documentation: z.string().optional(),
});

type SaveProjectFileInput = z.infer<typeof SaveProjectFileInput>;

/** Save or update a project file */
async function saveProjectFile(input: SaveProjectFileInput) {
  const validatedInput = SaveProjectFileInput.parse(input);

  const { projectId, filepath, content, summary, documentation } =
    validatedInput;

  // Extract filename and extension from filepath
  const filename = filepath.split("/").pop() || "";
  const extension = filename.includes(".")
    ? filename.split(".").pop() || ""
    : "";

  // Generate embedding for content and summary
  const textToEmbed = summary
    ? `${filepath}\n\n${summary}\n\n${content}`
    : `${filepath}\n\n${content}`;
  const [embedding] = await embedTexts([textToEmbed]);

  // Format the embedding array for PostgreSQL
  const formattedEmbedding = `[${embedding.join(",")}]`;

  // Check if the file already exists
  const checkQuery = `
    SELECT id FROM files
    WHERE project_id = $1 AND filepath = $2;
  `;

  try {
    const { rows } = await getDb().query(checkQuery, [projectId, filepath]);

    let result;
    if (rows.length > 0) {
      // File exists, update it
      const updateQuery = `
        UPDATE files
        SET content = $3, summary = $4, documentation = $5, extension = $6,
            num_chars = $7, filename = $8, embedding = $9::vector(1024),
            updated_at = NOW()
        WHERE id = $10
        RETURNING *;
      `;
      result = await getDb().query(updateQuery, [
        content,
        summary,
        documentation,
        extension,
        content.length,
        filename,
        formattedEmbedding,
        (rows[0] as any).id,
      ]);
    } else {
      // File doesn't exist, insert it
      const insertQuery = `
        INSERT INTO files (project_id, filepath, content, summary, documentation, extension, num_chars, filename, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector(1024))
        RETURNING *;
      `;
      result = await getDb().query(insertQuery, [
        projectId,
        filepath,
        content,
        summary,
        documentation,
        extension,
        content.length,
        filename,
        formattedEmbedding,
      ]);
    }

    return result.rows[0];
  } catch (error) {
    console.error("Error saving project file:", error);
    throw new Error("Failed to save project file to database");
  }
}

export const filesDb = {
  searchFiles,
  searchFilesWithEmbedding,
  searchFilesByKeyword,
  deleteProjectFiles,
  saveProjectFile,
  getFileByFilepath,
};
