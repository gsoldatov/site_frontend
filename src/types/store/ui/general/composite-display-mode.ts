import { compositeDisplayModeValues } from "../../data/composite";


/**
 * Composite object display modes dropdown options.
 */
export const compositeDisplayModeOptions: Record<string, { name: string, value: string }> = {
    basic: { name: "Basic", value: "basic" },
    groupedLinks: { name: "Grouped Links", value: "grouped_links" },
    multicolumn: { name: "Multicolumn", value: "multicolumn" },
    chapters: { name: "Chapters", value: "chapters" }
};


// Check if options object is properly defined
let optionsValues = Object.values(compositeDisplayModeOptions).map(v => v.value);

let missingOptions = compositeDisplayModeValues.filter(k => !optionsValues.includes(k));
if (missingOptions.length > 0) throw Error(`Missing display modes option values: ${missingOptions}`);

let invalidOptions = optionsValues.filter(k => !compositeDisplayModeValues.includes(k as any));
if (invalidOptions.length > 0) throw Error(`Invalid display modes option values: ${invalidOptions}`);
