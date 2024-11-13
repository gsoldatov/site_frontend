/** An element of a composite chapters hierarchy used to build /objects/view navigation in composite objects with "chapters" display mode. */
export type CompositeChaptersHierarchyElement = {
    /** Object ID of the current hierarchy element. */
    objectID: number,
    /** Element depth. */
    depthLevel: number, 

    /** Parent hierarchy element. */
    parentElement: CompositeChaptersHierarchyElement | null,
    /** Child hierarchy elements. */
    childElements: CompositeChaptersHierarchyElement[] | null,

    /** A string dot-separated chapter number of the current element. */
    chapter: string, 
    /** A string with the last part of chapter */
    chapterSuffix: string, 
    /** URL linking to the page of the hierarchy element. */
    URL: string, 
    /** Flag for using numeration when displaying the contents of the hierarchy. */
    numerateChapters: boolean
};


/** Hierarchy element data placeholder for an absent hierarchy. */
type ChapterHierarchyElementsNoHierarchy = { type: "no hierarchy" };
/** Hierarchy element data placeholder for an invalid chapter number. */
type ChapterHierarchyElementsInvalid = { type: "invalid" };
/** Hierarchy element data for a non-leaf. */
type ChapterHierarchyElementsContents = {
    type: "contents",
    current: CompositeChaptersHierarchyElement,
    root: CompositeChaptersHierarchyElement,
    previous?: CompositeChaptersHierarchyElement | null,
    next?: CompositeChaptersHierarchyElement | null
};
/** Hierarchy element data for a leaf. */
type ChapterHierarchyElementObject = {
    type: "object",
    current: CompositeChaptersHierarchyElement,
    root: CompositeChaptersHierarchyElement,
    parent: CompositeChaptersHierarchyElement | null,
    previous: CompositeChaptersHierarchyElement | null,
    next: CompositeChaptersHierarchyElement | null
};

/** Contains type of a composite chapters hierarchy element, its data & references to its neighbors, where applicable. */
export type ChapterHierarchyElementData = ChapterHierarchyElementsNoHierarchy | ChapterHierarchyElementsInvalid | 
                                          ChapterHierarchyElementsContents | ChapterHierarchyElementObject;
