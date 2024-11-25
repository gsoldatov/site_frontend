import React, { useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { updateEditedObject } from "../../../../reducers/data/edited-objects";
import { ObjectsEditSelectors } from "../../../../store/selectors/ui/objects-edit";

import { MarkdownEditor } from "../../../modules/markdown/markdown-editor";


/**
 * Markdown object data editor component.
 */
export const MarkdownDataEditor = memo(({ objectID }) => {
    const dispatch = useDispatch();

    const editedOrDefaultObjectSelector = useMemo(() => ObjectsEditSelectors.editedOrDefaultSelector(objectID), [objectID]);
    const rawMarkdown = useSelector(state => editedOrDefaultObjectSelector(state).markdown.raw_text);
    const parsedMarkdown = useSelector(state => editedOrDefaultObjectSelector(state).markdown.parsed);

    const rawMarkdownOnChange = useMemo(() => raw_text => dispatch(updateEditedObject(objectID, { markdown: { raw_text }})), [objectID]);
    const onPostParse = useMemo(() => parsed => dispatch(updateEditedObject(objectID, { markdown: { parsed }})), [objectID]);

    return <MarkdownEditor header="Markdown" rawMarkdown={rawMarkdown} rawMarkdownOnChange={rawMarkdownOnChange}
        parsedMarkdown={parsedMarkdown} onPostParse={onPostParse} />
});
