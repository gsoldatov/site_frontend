import { ObjectsListSelectors } from "../../store/selectors/ui/objects-list";
import { TagsSelectors } from "../../store/selectors/data/tags";
import { TagsTransformer } from "../../store/transformers/data/tags";

import type { State } from "../../store/types/state"
import { 
    type ObjectsListFetch, type ObjectsListPaginationInfo, type ObjectsListTagsFilterInput, type ObjectsListTagsInput
} from "../../store/types/ui/objects-list"


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates `state.objectsUI.fetch`. */
export const setObjectsListFetch = (fetch: Partial<ObjectsListFetch>) => ({ type: "SET_OBJECTS_LIST_FETCH", fetch });

const _setObjectsListFetch = (state: State, action: { fetch: Partial<ObjectsListFetch> }): State => {
    const fetch = { ...state.objectsListUI.fetch, ...action.fetch };
    return { ...state, objectsListUI: { ...state.objectsListUI, fetch }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates `state.objectsUI.paginationInfo`. */
export const setObjectsListPaginationInfo = (paginationInfo: Partial<ObjectsListPaginationInfo>) => ({ type: "SET_OBJECTS_LIST_PAGINATION_INFO", paginationInfo });

const _setObjectsListPaginationInfo = (state: State, action: { paginationInfo: Partial<ObjectsListPaginationInfo> }): State => {
    const paginationInfo = { ...state.objectsListUI.paginationInfo, ...action.paginationInfo };
    return { ...state, objectsListUI: { ...state.objectsListUI, paginationInfo }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Toggles presence of a `tagID` in state.objectsListUI.paginationInfo.tagsFilter.
 * 
 * If `tagIDs` is omitted or set to `undefined`, clears the list.
 */
export const setObjectsListTagsFilter = (tagID: number | undefined = undefined) => ({ type: "SET_OBJECTS_LIST_TAGS_FILTER", tagID });

const _setObjectsListTagsFilter = (state: State, action: { tagID: number | undefined }) => {
    const { tagID } = action;
    const oldTagsFilter = state.objectsListUI.paginationInfo.tagsFilter;
    const tagsFilter = 
        tagID === undefined
        ? []    // reset case

        : oldTagsFilter.includes(tagID)
        ? oldTagsFilter.filter(id => id !== tagID)  // remove existing
        : oldTagsFilter.concat([tagID])     // add non-existing
    ;

    return { 
        ...state,
        objectsListUI: {
            ...state.objectsListUI,
            paginationInfo: {
                ...state.objectsListUI.paginationInfo,
                tagsFilter
            }
        }
    };
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates state.objectsListUI.tagsFilterInput */
export const setObjectsListTagsFilterInput = (tagsFilterInput: Partial<ObjectsListTagsFilterInput>)  => ({ type: "SET_OBJECTS_LIST_TAGS_FILTER_INPUT", tagsFilterInput });

const _setObjectsListTagsFilterInput = (state: State, action: { tagsFilterInput: Partial<ObjectsListTagsFilterInput> }): State => {
    const tagsFilterInput = { ...state.objectsListUI.tagsFilterInput, ...action.tagsFilterInput };
    return { ...state, objectsListUI: { ...state.objectsListUI, tagsFilterInput }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Partially updates state.objectsListUI.tagsInput */
export const setObjectsListTagsInput = (tagsInput: Partial<ObjectsListTagsInput>) => ({ type: "SET_OBJECTS_LIST_TAGS_INPUT", tagsInput });

const _setObjectsListTagsInput = (state: State, action: { tagsInput: Partial<ObjectsListTagsInput> }): State => {
    const tagsInput = { ...state.objectsListUI.tagsInput, ...action.tagsInput };
    return { ...state, objectsListUI: { ...state.objectsListUI, tagsInput }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Sets /objects/list page delete dialog display. */
export const setObjectsListShowDeleteDialog = (showDeleteDialog: boolean) => ({ type: "SET_OBJECTS_LIST_SHOW_DELETE_DIALOG", showDeleteDialog });

const _setObjectsListShowDeleteDialog = (state: State, action: { showDeleteDialog: boolean }): State => {
    return { ...state, objectsListUI: { ...state.objectsListUI, showDeleteDialog: action.showDeleteDialog }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Selects objects with `objectIDs` on the /objects/list page. */
export const selectObjects = (objectIDs: number[]) => ({ type: "SELECT_OBJECTS", objectIDs });

const _selectObjects = (state: State, action: { objectIDs: number[] }): State => {
    const selectedObjectIDs = [ ...new Set(state.objectsListUI.selectedObjectIDs.concat(action.objectIDs) )];
    return { ...state, objectsListUI: { ...state.objectsListUI, selectedObjectIDs }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Toggles object selection and update delete dialog display on the /objects/list page. */
export const toggleObjectSelection = (objectID: number) => ({ type: "TOGGLE_OBJECT_SELECTION", objectID });

const _toggleObjectSelection = (state: State, action: { objectID: number }): State => {
    const { objectID } = action;
    const soIDs = state.objectsListUI.selectedObjectIDs;
    const selectedObjectIDs = soIDs.includes(objectID) ? soIDs.filter(id => id !== objectID) : soIDs.concat(objectID);
    const showDeleteDialog = selectedObjectIDs.length > 0 ? state.objectsListUI.showDeleteDialog : false;     // Reset delete dialog if no objects are selected
                                
    return { ...state, objectsListUI: { ...state.objectsListUI, selectedObjectIDs, showDeleteDialog }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Clears selected objects and closes delete dialog on the /objects/list page. */
export const clearSelectedObjects = () => ({ type: "CLEAR_SELECTED_OBJECTS" });

const _clearSelectedObjects = (state: State, action: any): State => {
    return { ...state, objectsListUI: { ...state.objectsListUI, selectedObjectIDs: [], showDeleteDialog: false }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * Toggles presence of tags in `addedTags` & `removedTagIDs` in the corresponding arrays of the /objects/list state:
 * 
 * `addedTags`:
 * - can contain tag names or IDs;
 * - already present tags are removed from the list;
 * - not prevously present tags, which are common to all selected objects, are added to the `removedTagIDs` list;
 * - other not previously present tags are added to the list.
 * 
 * `removedTagIDs`:
 * - can contain only tag IDs;
 * - already present tags are removed from the list (including common tags passed from `addedTags`);
 * - not previously present tags are added to the list.
 */
export const setObjectsListTagUpdates = (updates: { added?: (string | number)[], removed?: number[] }) => ({
    type: "SET_OBJECTS_LIST_TAG_UPDATES",
    addedTags: updates.added || [],
    removedTagIDs: updates.removed || []
});

const _setObjectsListTagUpdates = (state: State, action: { addedTags: (string | number)[], removedTagIDs: number[] }) => {
    const lowerCaseOldAddedTags = state.objectsListUI.addedTags.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));

    // Map added tags to their ID or names, where appropriate
    const mappedAddedTags = action.addedTags.map(tag => {
        if (typeof(tag) === "number") {
            // If a tag added by ID is already added by name, add it by name again
            if (lowerCaseOldAddedTags.includes(state.tags[tag].tag_name.toLowerCase())) return state.tags[tag].tag_name;
            return tag;
        }

        // If a tag added by name is already added by name, add it by name again
        if (lowerCaseOldAddedTags.includes(tag.toLowerCase())) return tag;

        // Add a tag for the first time by its ID or name
        return TagsSelectors.getTagIDByName(state, tag) || tag;
    });
    
    // Get a new addedTags list
    const lowerCaseMappedAddedTags = mappedAddedTags.map(t => TagsTransformer.getLowerCaseTagNameOrID(t));
    let addedTags = state.objectsListUI.addedTags.slice();
    addedTags = addedTags.filter(t => !lowerCaseMappedAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(t)));
    addedTags = addedTags.concat(mappedAddedTags.filter(t => !lowerCaseOldAddedTags.includes(TagsTransformer.getLowerCaseTagNameOrID(t))));

    // Filter out common tags, which are added (they will be added to removed tags later)
    const addedExistingTagIDs = addedTags.filter(t => ObjectsListSelectors.commonTagIDs(state).includes(t as number));
    addedTags = addedTags.filter(t => !addedExistingTagIDs.includes(t));

    // Stop removing tags passed for the second time or added common tags already being removed
    let removedTagIDs = state.objectsListUI.removedTagIDs.slice();
    const removedExistingTagIDs = (addedExistingTagIDs as number[]).filter(t => !removedTagIDs.includes(t as number));
    removedTagIDs = removedTagIDs.filter(t => !action.removedTagIDs.includes(t) && !addedExistingTagIDs.includes(t));
        
    // Remove tags passed for the first time or added common tags, which were not being removed
    removedTagIDs = removedTagIDs.concat(action.removedTagIDs.filter(t => !state.objectsListUI.removedTagIDs.includes(t)));
    removedTagIDs = removedTagIDs.concat(
        removedExistingTagIDs.filter(t => !removedTagIDs.includes(t as number))
    );

    return { ...state, objectsListUI: { ...state.objectsListUI, addedTags,  removedTagIDs }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/** Clears added & removed tags on the /objects/list page. */
export const clearObjectsListTagUpdates = () => ({ type: "CLEAR_OBJECTS_LIST_TAG_UPDATES" });

const _clearObjectsListTagUpdates = (state: State, action: any): State => {
    return { ...state, objectsListUI: { ...state.objectsListUI, addedTags: [], removedTagIDs: [] }};
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export const objectsListRoot = {
    "SET_OBJECTS_LIST_FETCH": _setObjectsListFetch,
    "SET_OBJECTS_LIST_PAGINATION_INFO": _setObjectsListPaginationInfo,
    "SET_OBJECTS_LIST_TAGS_FILTER": _setObjectsListTagsFilter,
    "SET_OBJECTS_LIST_TAGS_FILTER_INPUT": _setObjectsListTagsFilterInput,
    "SET_OBJECTS_LIST_TAGS_INPUT": _setObjectsListTagsInput,
    "SET_OBJECTS_LIST_SHOW_DELETE_DIALOG": _setObjectsListShowDeleteDialog,
    
    "SELECT_OBJECTS": _selectObjects,
    "TOGGLE_OBJECT_SELECTION": _toggleObjectSelection,
    "CLEAR_SELECTED_OBJECTS": _clearSelectedObjects,

    "SET_OBJECTS_LIST_TAG_UPDATES": _setObjectsListTagUpdates,
    "CLEAR_OBJECTS_LIST_TAG_UPDATES": _clearObjectsListTagUpdates
};
