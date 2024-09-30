import { getThresholdForValue } from "../../src/util/size-context-wrappers";


test("getThresholdForValue", () => {
    expect(getThresholdForValue(0, [])).toEqual(0);
    expect(getThresholdForValue(1000, [])).toEqual(0);

    expect(getThresholdForValue(99, [100])).toEqual(0);
    expect(getThresholdForValue(100, [100])).toEqual(0);
    expect(getThresholdForValue(101, [100])).toEqual(1);

    expect(getThresholdForValue(99, [100, 200])).toEqual(0);
    expect(getThresholdForValue(100, [100, 200])).toEqual(0);
    expect(getThresholdForValue(101, [100, 200])).toEqual(1);
    expect(getThresholdForValue(200, [100, 200])).toEqual(1);
    expect(getThresholdForValue(201, [100, 200])).toEqual(2);
});
