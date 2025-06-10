module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  testMatch: ["**/__tests__/**/*.{js,jsx}", "**/?(*.)+(spec|test).{js,jsx}"]
};
