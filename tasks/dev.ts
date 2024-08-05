import { $ } from "bun";

await Promise.all([$`bun run dev:app`, $`bun run dev:api`]);
