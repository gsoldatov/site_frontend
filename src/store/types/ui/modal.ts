import { z } from "zod";

import type { DeepPartial } from "../../../util/types/common";
import { deepMerge } from "../../../util/copy";


/** Modal window UI state schema. */
export const modalUI = z.object({
    image: z.object({
        URL: z.string(),
        isExpanded: z.boolean()
    })
});


/** 
 * Returns a modal UI state with default values being replaced `customValues` (can be deep partial).
 */
export const getModalUIState = (customValues: DeepPartial<ModalUI> = {}) => {
    const result = deepMerge(
        {
            image: {
                URL: "",
                isExpanded: false
            }
        },
        
        customValues
    );
    
    return modalUI.parse(result);

};


/** Modal window UI state type. */
type ModalUI = z.infer<typeof modalUI>;
/** Modal window image state type. */
export type ModalImageUI = ModalUI["image"];
