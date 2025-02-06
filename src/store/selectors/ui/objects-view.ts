import { ObjectsSelectors } from "../data/objects/objects";
import { CompositeSelectors } from "../data/objects/composite";

import { NumericUserLevel } from "../../../types/store/data/auth";
import type { State } from "../../../types/store/state";
import type { CompositeChaptersHierarchyElement, ChapterHierarchyElementData } from "../../../types/store/ui/objects-view";


/** /objects/view/:id page state selectors. */
export class ObjectsViewSelectors {
    /**
     * Returns true if current user can update object with the specified `objectID`
     */
    static canEditObject(state: State, objectID: number) {
        // Exit early, if attributes or data are absent
        if (state.objects[objectID] === undefined) return false;
        if (!ObjectsSelectors.dataIsPresent(state, objectID)) return false;

        return state.auth.numeric_user_level === NumericUserLevel.admin
            || (state.auth.numeric_user_level > NumericUserLevel.anonymous && state.objects[objectID].owner_id === state.auth.user_id);
    };

    /**
     * Returns a boolean indicating if a description of an object with provided `objectID` must be displayed.
     */
    static showDecsription(state: State, objectID: number) {
        const { object_type } = (state.objects[objectID] || {});
        const { show_description } = (state.objects[objectID] || {});
        const { show_description_as_link } = (state.links[objectID] || {});
        
        return (
            // show_description = false
            show_description
            // AND NOT (object type = link AND show_description_as_link = true)
            && !(object_type === "link" && show_description_as_link)
        );
    };

    /**
     * Returns a boolean indicating if link data of an object with provided `objectID` must be displyed merged with description.
     */
    static showDescriptionAsLink(state: State, objectID: number) {
        return (state.links[objectID] || {}).show_description_as_link;
    }

    /**
     * Returns a boolean indicating if a description of a subobject with the provided `subobjectID` of the parent object with `objectID` must be displayed.
     */
    static showSubobjectDescription(state: State, objectID: number, subobjectID: number) {
        // Settings of the subobject
        const _subobjectAttributes = state.objects[subobjectID] || {};
        const _subobjectCompositeProps = (state.composite[objectID] || { subobjects: { [subobjectID]: {} }}).subobjects[subobjectID];
        const showDescription = _subobjectAttributes.show_description;
        const showDescriptionComposite = _subobjectCompositeProps.show_description_composite;

        // Return false if description is displayed as a link
        if (ObjectsViewSelectors.showSubobjectDescriptionAsLink(state, objectID, subobjectID)) return false;

        // Return true if `show_description_composite` is true or `show_description` = true is inherited
        return showDescriptionComposite === "yes" || (showDescriptionComposite === "inherit" && showDescription);
    };

    
    /**
     * Returns a boolean indicating if link data of a subobject with the provided `subobjectID` of the parent object with `objectID` must be displyed merged with description.
     */
    static showSubobjectDescriptionAsLink(state: State, objectID: number, subobjectID: number) {
        const showDescriptionAsLink = (state.links[subobjectID] || {}).show_description_as_link;
        const showDescriptionAsLinkComposite = (state.composite[objectID] || { subobjects: { [subobjectID]: {} }}).subobjects[subobjectID].show_description_as_link_composite;
        return (
            // show_description_as_link_composite = yes
            showDescriptionAsLinkComposite === "yes"
            // OR (show_description_as_link_composite = inherit AND show_description_as_link = true)
            || (showDescriptionAsLinkComposite === "inherit" && showDescriptionAsLink)
        );
    };

    /**
     * Returns a hierarchy of chapters for a composite object with the provided `objectID`.
     */
    static buildCompositeChaptersHierarchy(state: State, objectID: number, maxHierarchyDepth: number) {
        if (state.composite[objectID] === undefined) return null;

        const getHierarchy = (currentDepth: number, 
                              elementObjectID: number, 
                              parentElement: CompositeChaptersHierarchyElement | null, 
                              parentChapter: string, 
                              chapterSuffix: string
        ): CompositeChaptersHierarchyElement => {
            // Calculate element props
            const chapter = parentChapter + (parentChapter.length > 0 ? "." : "") + chapterSuffix;
            let elementURL = `/objects/view/${objectID}`;
            if (chapter.length > 0) {
                const searchParams = new URLSearchParams();
                searchParams.append("ch", chapter);
                elementURL += "?" + searchParams.toString();
            }

            // End recursion if object is not composite with "chapters" display mode or maximum hierarchy depth is exceeded
            const objectType = (state.objects[elementObjectID] || {}).object_type;
            const displayMode = (state.composite[elementObjectID] || {}).display_mode;
            const numerateChapters = (state.composite[elementObjectID] || {}).numerate_chapters;
            const isLeaf = objectType !== "composite" || displayMode !== "chapters" || currentDepth > maxHierarchyDepth;

            const element: CompositeChaptersHierarchyElement = { 
                objectID: elementObjectID, depthLevel: currentDepth, 
                parentElement, childElements: null, 
                chapter, chapterSuffix, URL: elementURL, numerateChapters 
            };
            if (!isLeaf) element.childElements = CompositeSelectors.getSingleColumnSubobjectDisplayOrder(state.composite[elementObjectID])
                    .map((subobjectID, i) => getHierarchy(currentDepth + 1, subobjectID, element, chapter, (i + 1).toString()));
            return element;
        };

        // return { objectID, elements: getHierarchy(2, objectID) };
        return getHierarchy(1, objectID, null, "", "");
    }

    /**
     * Loops through the provided `hierarchy` and returns an object, containing `type` of the element corresponding to the provided `chapter`.
     * If possible, also returns `current`, `parent`, `root`, `previous` and `next` hierarchy elements.
     * `type` can be one of the following values:
     * - "no hierarchy" if no hierarchy was provided;
     * - "invalid" if provided `chapter` does not correspond to a hierarchy element;
     * - "contents" if provided `chapter` corresponds to a composite object with "chapters" display mode (within the maximum hierarchy depth);
     * - "object" for other valid objects.
     */
    static getHierarchyElements(hierarchy: CompositeChaptersHierarchyElement, chapter: string): ChapterHierarchyElementData {
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
        const parent = currentElement.parentElement as CompositeChaptersHierarchyElement;

        const previousChapterSuffix = parseInt(currentElement.chapterSuffix) - 1;   // 1-based suffix of the previous chapter
        const previous = parent.childElements ? (parent.childElements[previousChapterSuffix - 1] || null): null;

        const nextChapterSuffix = parseInt(currentElement.chapterSuffix) + 1;   // 1-based suffix of the next chapter
        const next = parent.childElements ? (parent.childElements[nextChapterSuffix - 1] || null) : null;

        return {
            type: currentElement.childElements ? "contents" : "object",
            current: currentElement, parent, root: hierarchy, previous, next
        };
    };
}
