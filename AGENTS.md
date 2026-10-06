# luna-builder-sdk — Codex entry point

Read and follow [CLAUDE.md](CLAUDE.md) before working on this SDK. It is the shared
development guidance for both Claude Code and Codex, including architecture,
conventions, tests, and plugin generation. Keep those instructions in one place.

The six shared skills in `skills/` are exposed to Codex through `.agents/skills/`.
For Add On work, use the relevant skill and [docs/llms.txt](docs/llms.txt) to find
the consumer documentation. In this checkout, resolve the builder root to this
directory and run `node <builder>/dist/cli.js` after `npm run build`.

For work outside this checkout, use the generated `ua-luna-builder` plugin;
see [README.md](README.md#codex). Edit plugin sources in `plugin/` and `skills/`,
then rebuild; never edit generated files in `plugins/`.
