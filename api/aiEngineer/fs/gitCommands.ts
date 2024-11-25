import { stat } from "node:fs/promises";
import pathUtils from "node:path";
import { runShellCommand } from "./runShellCommand";

const GIT_COMMANDS = {
  unCommittedChanges: `git status -s`,
  lastFileModified: `{ git ls-files --exclude-standard -c && git ls-files --others --exclude-standard; } | xargs stat -f '%m %N' 2>/dev/null | sort -nr | head -n 1`,
  log: (maxChars = 10_000) =>
    `git log --pretty=format:'%h %s' --name-status | head -c ${maxChars}`,
  listFiles: `git ls-files --exclude-standard -c && git ls-files --others --exclude-standard`,
  activeBranch: `git rev-parse --abbrev-ref HEAD`,
};
export const createProjectGit = (absolutePath: string) => {
  const runGitCommand = async (command: string) => {
    try {
      return await runShellCommand(absolutePath, command);
    } catch (error) {
      // Return null for git commands that fail
      return null;
    }
  };

  const getUncommittedChanges = async () => {
    let output = await runGitCommand(GIT_COMMANDS.unCommittedChanges);
    if (!output) return [];
    // Process the output into a JSON array of { status, statusCode, filepath }
    const changes = output.split("\n").filter(Boolean).map(parseGitStatusItem);
    return changes;
  };

  const getUnstagedChanges = async () => {
    const changes = await getUncommittedChanges();
    return changes.filter(
      (change) =>
        change.statusCode === "??" || // Untracked
        change.statusCode === " M" || // Modified (unstaged)
        change.statusCode === " D" // Deleted (unstaged)
    );
  };
  const getLastModifiedFile = async () => {
    // Try git first
    let output = await runGitCommand(GIT_COMMANDS.lastFileModified);

    if (output) {
      const [timestamp, ...filePathParts] = output.split(" ");
      const filepath = filePathParts.join(" ");
      return {
        updatedAt: new Date(parseInt(timestamp) * 1000).toISOString(),
        filepath,
      };
    }

    try {
      // Fall back to checking first file's timestamp
      const files = await listFiles();
      if (!files.length) return null;

      const filepath = files[0];
      const fullPath = pathUtils.join(absolutePath, filepath);
      const stats = await stat(fullPath);

      return {
        updatedAt: new Date(
          Math.max(stats.mtimeMs, stats.ctimeMs)
        ).toISOString(),
        filepath,
      };
    } catch (error) {
      return null;
    }
  };
  const getStatus = async () => {
    let [changes, branch] = await Promise.all([
      getUncommittedChanges(),
      getActiveBranch(),
    ]);
    let unstaged = changes.filter(
      (change) =>
        change.statusCode === "??" || // Untracked
        change.statusCode === " M" || // Modified (unstaged)
        change.statusCode === " D" // Deleted (unstaged)
    );
    let hasUnstagedChanges = unstaged.length > 0;
    return {
      activeBranch: branch,
      uncommitted: changes,
      unstaged,
      hasUnstagedChanges,
      hasUncommittedChanges: changes.length > 0,
    };
  };
  const listFiles = async () => {
    let output = await runGitCommand(GIT_COMMANDS.listFiles);
    if (!output) return [];
    let files = output.split("\n").filter(Boolean);
    // Foreach file, ensure it actually exists.
    // there could have been a move or rename that hasn't been committed.
    files = (await Promise.all(
      files.map(async (file) => {
        let filepath = pathUtils.join(absolutePath, file);
        const exists = await Bun.file(filepath).exists();
        return exists ? file : null;
      })
    ).then((files) => files.filter(Boolean))) as string[];

    files = files.sort((a, b) => {
      const isRootFileA = !a.includes("/");
      const isRootFileB = !b.includes("/");

      if (isRootFileA && !isRootFileB) return 1;
      if (!isRootFileA && isRootFileB) return -1;

      // If both are root files or both are not, sort alphabetically
      return a.localeCompare(b);
    });
    return files;
  };

  const getActiveBranch = async () => {
    let output = await runGitCommand(GIT_COMMANDS.activeBranch);
    return output || null;
  };

  return {
    listFiles,
    getUncommittedChanges,
    getUnstagedChanges,
    getLastModifiedFile,
    getStatus,
    getActiveBranch,
  };
};

const parseGitStatusItem = (line: string) => {
  const statusCode = line.slice(0, 2);
  const filepath = line.slice(3);
  let status;

  switch (statusCode) {
    case "??":
      status = "Untracked";
      break;
    case "A ":
      status = "Staged (new file)";
      break;
    case " M":
      status = "Modified (unstaged)";
      break;
    case "M ":
      status = "Modified (staged)";
      break;
    case " D":
      status = "Deleted (unstaged)";
      break;
    case "D ":
      status = "Deleted (staged)";
      break;
    case "R ":
      status = "Renamed";
      break;
    case "C ":
      status = "Copied";
      break;
    case "UU":
      status = "Unmerged";
      break;
    case "AU":
      status = "Unmerged (added by us)";
      break;
    case "UD":
      status = "Unmerged (deleted by them)";
      break;
    case "UA":
      status = "Unmerged (added by them)";
      break;
    case "DU":
      status = "Unmerged (deleted by us)";
      break;
    case "AA":
      status = "Unmerged (both added)";
      break;
    case "DD":
      status = "Unmerged (both deleted)";
      break;
    default:
      status = "Unknown";
  }

  return { status, statusCode, filepath };
};
