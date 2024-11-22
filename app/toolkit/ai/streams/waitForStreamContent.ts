/**
 * Creates a stream processor that buffers content and triggers callbacks when specific content markers are found.
 * This is particularly useful when processing streaming LLM responses that contain tagged sections.
 *
 * @param startStr - The string marker to start capturing content from (e.g., "<final_output>")
 * @param callback - Function called with captured content both when the marker is found and for subsequent content
 * @returns A function that processes each chunk of streamed content
 *
 * @example
 * // Basic usage with LLM stream processing
 * const emitter = new LLMEventEmitter();
 * let capturedContent = "";
 *
 * const processor = waitForStreamContent("<final_output>", (content) => {
 *   capturedContent += content;
 *   console.log("Captured content:", content);
 * });
 *
 * emitter.on("content", processor);
 *
 * @example
 * // Real-world usage from generateFolderSummary
 * let innerResult = "";
 * const waitForFinalOutput = waitForStreamContent("<final_output>", (content) => {
 *   innerResult += content;
 *   emitter?.emit("data", {
 *     type: "section",
 *     index: sectionIndex,
 *     title: sectionTitle,
 *     delta: content
 *   });
 * });
 * innerEmitter.on("content", waitForFinalOutput);
 *
 * @remarks
 * - The function maintains an internal buffer to handle cases where the marker might be split across chunks
 * - Once the start marker is found, all subsequent content is passed to the callback
 * - The buffer is automatically trimmed to prevent memory issues
 * - This is commonly used with LLM responses that contain structured sections like <thinking>, <review>, <final_output>
 *
 * @throws {never} This function doesn't throw errors, but invalid input might result in missed content
 */
export function waitForStreamContent(
  startStr: string,
  callback: (content: string) => void
) {
  let buffer = "";
  let insideTag = false;

  return (delta: string) => {
    buffer += delta;

    if (!insideTag && buffer.includes(startStr)) {
      insideTag = true;
      buffer = buffer.slice(buffer.indexOf(startStr) + startStr.length);
      callback(buffer);
    } else if (insideTag) {
      callback(delta);
    }

    // Prevent buffer overflow
    if (buffer.length > startStr.length * 2) {
      buffer = buffer.slice(-startStr.length * 2);
    }
  };
}
