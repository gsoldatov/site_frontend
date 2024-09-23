import { deepCopy } from "../../src/util/copy";
import { hasEqualAttributes } from "../../src/util/equality-checks";

import mainConfig from "../../src/config.json";
import { getFullTestConfig } from "../_mocks/config";


const fs = require("fs");
const path = require("path");

const sampleConfigFilePath = path.resolve(__filename, "../../../src/config.json.sample");
const sampleConfigText = fs.readFileSync(sampleConfigFilePath);
const sampleConfig = JSON.parse(sampleConfigText);


test("All configs have equal attributes", () => {
    expect(hasEqualAttributes(mainConfig, sampleConfig)).toBeTruthy();
    expect(hasEqualAttributes(mainConfig, getFullTestConfig())).toBeTruthy();
});


test("Test config with custom props has correct attributes", () => {
    const testConfig = getFullTestConfig({ app: { compositeChapters: { maxHierarchyDepth: 10 }}});
    expect(hasEqualAttributes(mainConfig, testConfig)).toBeTruthy();
});


test("Modified configs don't have equal attributes", () => {
    const mainConfigCopy = deepCopy(mainConfig);
    mainConfigCopy.__nonExistingAttribute = 1;
    expect(hasEqualAttributes(mainConfig, mainConfigCopy)).toBeFalsy();
});
