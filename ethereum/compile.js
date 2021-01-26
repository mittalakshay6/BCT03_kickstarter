const path = require("path");
const solc = require("solc");
const fs = require("fs-extra");

const buildPath = path.resolve(__dirname, "build");
fs.removeSync(buildPath);

const campaignPath = path.resolve(__dirname, "contracts", "Campaign.sol");
const src = fs.readFileSync(campaignPath, "utf8");

let compilerInput = {
  language: "Solidity",
  sources: {
    "Campaign.sol": {
      content: src,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
  },
};
console.log("Compiling contract");
let compiledContracts = JSON.parse(solc.compile(JSON.stringify(compilerInput)))
  .contracts;
console.log("Contract Compiled");
fs.ensureDirSync(buildPath);

for (let contract in compiledContracts["Campaign.sol"]) {
  fs.outputJSONSync(
    path.resolve(buildPath, contract + ".json"),
    compiledContracts["Campaign.sol"][contract]
  );
}
