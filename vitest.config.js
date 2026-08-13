import { defineConfig } from "vitest/config";

// Kept separate from vite.config.js so tests don't trigger the build config's
// pack cooking and dummy-file generation.
export default defineConfig({
    test: {
        include: ["src/**/*.test.js"],
        environment: "node"
    }
});
