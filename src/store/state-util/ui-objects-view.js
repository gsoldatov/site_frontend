import { createSelector } from "reselect";

import config from "../../config";

import { enumCompositeObjectDisplayModes } from "../../util/enum-composite-object-display-modes";
import { enumShowDescriptionComposite } from "../state-templates/composite-subobjects";
import { getSingleColumnSubobjectDisplayOrder } from "./composite";


/**
 * Returns a Redux selector, which calculates the chapter hierarchy for the provided `objectID`.
 */
 export const getChaptersHierarchySelector = objectID => createSelector(
    state => state.objects,
    state => state.composite,
    (objectsStorage, compositeDataStorage) => {
        if (compositeDataStorage[objectID] === undefined) return null;

        const getHierarchy = (currentDepth, elementObjectID, parentElement, parentChapter, chapterSuffix) => {
            // Calculate element props
            const chapter = parentChapter + (parentChapter.length > 0 ? "." : "") + chapterSuffix;
            let elementURL = `/objects/view/${objectID}`;
            if (chapter.length > 0) {
                const searchParams = new URLSearchParams();
                searchParams.append("ch", chapter);
                elementURL += "?" + searchParams.toString();
            }

            // End recursion if object is not composite with "chapters" display mode or maximum hierarchy depth is exceeded
            const objectType = (objectsStorage[elementObjectID] || {}).object_type;
            const displayMode = (compositeDataStorage[elementObjectID] || {}).display_mode;
            const numerateChapters = (compositeDataStorage[elementObjectID] || {}).numerate_chapters;
            const isLeaf = objectType !== "composite" || displayMode !== enumCompositeObjectDisplayModes.chapters.value || currentDepth > config.compositeChapters.maxHierarchyDepth;

            const element = { objectID: elementObjectID, parentElement, chapter, chapterSuffix, URL: elementURL, numerateChapters };
            element.childElements = isLeaf ? null 
                : getSingleColumnSubobjectDisplayOrder(compositeDataStorage[elementObjectID])
                    .map((subobjectID, i) => getHierarchy(currentDepth + 1, subobjectID, element, chapter, i + 1));
            return element;
        };

        // return { objectID, elements: getHierarchy(2, objectID) };
        return getHierarchy(2, objectID, null, "", "");
    }
);


/**
 * Loops through the provided `hierarchy` and returns an object, containing `type` of the element corresponding to the provided `chapter`.
 * If possible, also returns `current`, `parent`, `root`, `previous` and `next` hierarchy elements.
 * `type` can be one of the following values:
 * - "no hierarchy" if no hierarchy was provided;
 * - "invalid" if provided `chapter` does not correspond to a hierarchy element;
 * - "contents" if provided `chapter` corresponds to a composite object with "chapters" display mode (within the maximum hierarchy depth);
 * - "object" for other valid objects.
 */
 export const getHierarchyElements = (hierarchy, chapter) => {
    // No hierarchy provided case
    if (!hierarchy) return { type: "no hierarchy" };

    // Root page case
    if (!chapter) return { type: "contents", current: hierarchy, root: hierarchy };

    const splitChapters = chapter.split(".");
    let currentElement = hierarchy, parentElement = null;

    // Loop through the hierarchy and exit if chapter is invalid
    for (let i = 0; i < splitChapters.length; i++) {
        const chapterNumber = parseInt(splitChapters[i]) - 1;  // Convert 1-based chapter numeration into array index
        parentElement = currentElement;
        currentElement = (currentElement.childElements || [])[chapterNumber];
        if (currentElement === undefined) return { type: "invalid" };
    }

    // Get parent, previous & next elements
    const parent = currentElement.parentElement;

    const previousChapterSuffix = parseInt(currentElement.chapterSuffix) - 1;   // 1-based suffix of the previous chapter
    const previous = currentElement.parentElement.childElements[previousChapterSuffix - 1] || null;

    const nextChapterSuffix = parseInt(currentElement.chapterSuffix) + 1;   // 1-based suffix of the next chapter
    const next = currentElement.parentElement.childElements[nextChapterSuffix - 1] || null;

    return {
        type: currentElement.childElements ? "contents" : "object",
        current: currentElement, parent, root: hierarchy, previous, next
    };
};


/**
 * Returns a selector, which checks if the description of an object with provided `objectID` must be displayed.
 */
export const getDefaultShowDescriptionSelector = objectID => state => {
    const objectType = (state.objects[objectID] || {}).object_type;
    const showDescription = (state.objects[objectID] || {}).show_description;
    const showDescriptionAsLink = (state.links[objectID] || {}).show_description_as_link;
    
    return (
        // show_description = false
        showDescription
        // AND NOT (object type = link AND show_description_as_link = true)
        && !(objectType === "link" && showDescriptionAsLink)
    );
};


/**
 * Returns a selector, which checks if the description of a subobject with the provided `subobjectID` of the parent object with `objectID` must be displayed.
 */
export const getSubobjectShowDescriptionSelector = (objectID, subobjectID) => state => {
    const _subobjectAttributes = state.objects[subobjectID] || {};
    const _subobjectCompositeProps = (state.composite[objectID] || { subobjects: { [subobjectID]: {} }}).subobjects[subobjectID];
    const _subobjectLinkDataProps = (state.links[subobjectID] || {});

    // Settings of the subobject
    const objectType = _subobjectAttributes.object_type;
    const showDescription = _subobjectAttributes.show_description;
    const showDescriptionComposite = _subobjectCompositeProps.show_description_composite;
    const showDescriptionAsLink = _subobjectLinkDataProps.show_description_as_link;
    const showDescriptionAsLinkComposite = _subobjectCompositeProps.show_description_as_link_composite;

    // Return false if `show_description_as_link` is true
    const showDescriptionAsLinkSelector = getSubobjectShowDescriptionAsLinkSelector(objectID, subobjectID);
    
    if (showDescriptionAsLinkSelector(state)) return false;

    // Return true if `show_description_composite` is true or `show_description` = true is inherited
    return (
        showDescriptionComposite === enumShowDescriptionComposite.yes.value
        || (showDescriptionComposite === enumShowDescriptionComposite.inherit.value && showDescription)
    );
};


/**
 * Returns a selector, which checks if link data of an object with provided `objectID` must be displyed merged with description.
 */
export const getDefaultShowDescriptionAsLinkSelector = objectID => state => (state.links[objectID] || {}).show_description_as_link;


/**
 * Returns a selector, which checks if link data of a subobject with the provided `subobjectID` of the parent object with `objectID` must be displyed merged with description.
 */
 export const getSubobjectShowDescriptionAsLinkSelector = (objectID, subobjectID) => state => {
    const showDescriptionAsLink = (state.links[subobjectID] || {}).show_description_as_link;
    const showDescriptionAsLinkComposite = (state.composite[objectID] || { subobjects: { [subobjectID]: {} }}).subobjects[subobjectID].show_description_as_link_composite;
    return (
        // show_description_as_link_composite = yes
        showDescriptionAsLinkComposite === enumShowDescriptionComposite.yes.value
        // OR (show_description_as_link_composite = inherit AND show_description_as_link = true)
        || (showDescriptionAsLinkComposite === enumShowDescriptionComposite.inherit.value && showDescriptionAsLink)
    );
 };