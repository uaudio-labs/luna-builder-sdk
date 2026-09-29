import { defineConfig } from 'vitest/config';

// Lanes:
//   tests/unit   — always; ports, store, client against fakes and Luna.MockPort
//   tests/live   — only with UA_LIVE=1; needs native LUNA on ws://localhost:4718 with a session open
//   tests/engine — Phase 4; real devicedwasm in headless Chromium
const live = process.env['UA_LIVE'] === '1';

export default defineConfig({
  test: {
    include: live ? ['tests/live/**/*.test.ts'] : ['tests/unit/**/*.test.ts'],
    // node by default; the example-page tests opt into jsdom per file, because the SDK
    // itself is happier in the node realm (its scheduler then takes the macrotask path).
    environment: 'node',
    fileParallelism: !live,
    testTimeout: live ? 20_000 : 5_000,
  },
});
