import { deepCopy } from "../../src/util/copy";
import { hasEqualAttributes } from "../../src/util/equality-checks";

import appConfig from "../../src/config.json";
import testConfig from "../_mocks/config_.json";

const fs = require("fs");
const path = require("path");

const sampleConfigFilePath = path.resolve(__filename, "../../../src/config.json.sample");
const sampleConfigText = fs.readFileSync(sampleConfigFilePath);
const sampleConfig = JSON.parse(sampleConfigText);


test("All configs have equal attributes", () => {
    expect(hasEqualAttributes(appConfig, sampleConfig)).toBeTruthy();
    expect(hasEqualAttributes(appConfig, testConfig)).toBeTruthy();
});


test("Modified configs don't have equal attributes", () => {
    const appConfigCopy = deepCopy(appConfig);
    appConfigCopy.__nonExistingAttribute = 1;
    expect(hasEqualAttributes(appConfig, appConfigCopy)).toBeFalsy();
});
