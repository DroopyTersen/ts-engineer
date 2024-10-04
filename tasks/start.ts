import { $ } from "bun";

await Promise.all([$`bun run start:app`, $`bun run start:api`]);
