const fs = require("fs");
const path = require("path");
const internal = fs.readdirSync(path.resolve(__dirname, "internal"))
    .filter(file => fs.existsSync(path.resolve(__dirname, "internal", file, "jest.config.js")))
    .map(file => `<rootDir>/internal/${file}`);
const packages = fs.readdirSync(path.resolve(__dirname, "packages"))
    .filter(file => fs.existsSync(path.resolve(__dirname, "packages", file, "jest.config.js")))
    .map(file => `<rootDir>/packages/${file}/jest.config.js`);

module.exports = {
    projects: [
        ...internal,
        ...packages,
    ],
};