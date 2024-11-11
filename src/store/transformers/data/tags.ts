export class TagsTransformer {
    /**
     * Returns lowercase `tag` if its type = string or `tag` otherwise.
     */
    static getLowerCaseTagNameOrID = (tagNameOrID: string | number) => typeof(tagNameOrID) === "string" ? tagNameOrID.toLowerCase() : tagNameOrID;
}
