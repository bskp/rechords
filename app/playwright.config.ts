import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 10000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://localhost:3333",
    headless: true,
  },
  webServer: {
    command: "meteor --production --settings settings.json --exclude-archs web.browser.legacy --port 3333",
    url: "http://localhost:3333",
    reuseExistingServer: !process.env.CI,
    gracefulShutdown: true,
    timeout: 50000,
    stdout: 'pipe',
    stderr: 'pipe',
    wait: {
      stdout: /=> App running at: http:\/\/localhost:(?<my_server_port>\d+)\//
    },
  },
});