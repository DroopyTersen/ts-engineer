import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
export const runShellCommand = async (
  absolutePath: string,
  command: string
) => {
  try {
    console.log(`> cd ${absolutePath} && ${command}\n`);
    const { stdout } = await execAsync(`cd ${absolutePath} && ${command}`);
    return stdout.trim();
  } catch (error) {
    console.error(`Error executing shell command: ${command}`);
    console.error(error);
    return ""; // Return empty string on error
  }
};
