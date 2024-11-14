import { compositeShowDescriptionValues } from "../../data/composite";


/**
 * Composite subobject description & show description as link dropdown options.
 */
export const showDescriptionCompositeOptions: Record<string, { name: string, value: string }> = {
    yes: { name: "Yes", value: "yes" },
    no: { name: "No", value: "no" },
    inherit: { name: "Inherit", value: "inherit" }
};


// Check if options object is properly defined
let optionsKeys = Object.keys(showDescriptionCompositeOptions);

let missingOptions = compositeShowDescriptionValues.filter(k => !optionsKeys.includes(k));
if (missingOptions.length > 0) throw Error(`Missing show description dropdown options: ${missingOptions}`);

let invalidOptions = optionsKeys.filter(k => !compositeShowDescriptionValues.includes(k as any));
if (invalidOptions.length > 0) throw Error(`Invalid show description dropdown options: ${invalidOptions}`);
