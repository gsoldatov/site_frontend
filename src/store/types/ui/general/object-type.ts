import { objectTypeValues } from "../../data/objects";


/**
 * Object types UI data
 */
export const objectTypeOptions: Record<string, { type: string, name: string, multipleName: string, icon: string }> = {
    link: { type: "link", name: "Link", multipleName: "Links", icon: "linkify" },
    markdown: { type: "markdown", name: "Markdown", multipleName: "Markdown", icon: "arrow down" },
    to_do_list: { type: "to_do_list", name: "To-do list", multipleName: "To-do lists", icon: "check square outline" },
    composite: { type: "composite", name: "Composite object", multipleName: "Composite objects", icon: "copy outline" }
};


// Check if options object is properly defined
let optionsKeys = Object.keys(objectTypeOptions);

let missingOptions = objectTypeValues.filter(k => !optionsKeys.includes(k));
if (missingOptions.length > 0) throw Error(`Missing object type options: ${missingOptions}`);

let invalidOptions = optionsKeys.filter(k => !objectTypeValues.includes(k));
if (invalidOptions.length > 0) throw Error(`Invalid object type options: ${invalidOptions}`);
