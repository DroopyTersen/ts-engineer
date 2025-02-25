import { wait } from "~/toolkit/utils/wait";

export const fakeStreamer = async (
  content: string,
  onDelta: (delta: string) => void,
  options?: { chunkSize?: number; interval?: number }
) => {
  if (!content) {
    Promise.resolve(content);
  }
  let position = 0;
  let chunkSize = options?.chunkSize ?? 70;
  let interval = options?.interval ?? 100;
  while (position < content.length) {
    const chunk = content.substring(position, position + chunkSize);
    onDelta(chunk);
    position += chunkSize;
    await wait(interval);
  }
  return content;
};
