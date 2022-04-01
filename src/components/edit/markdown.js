import React, { useMemo, memo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setEditedObject } from "../../actions/objects-edit";
import { getEditedOrDefaultObjectSelector } from "../../store/state-util/ui-objects-edit";

import { MarkdownEditor } from "./common/markdown-editor";


/**
 * Markdown object data editor component.
 */
export const MarkdownDataEditor = memo(({ objectID }) => {
    const dispatch = useDispatch();

    const editedOrDefaultObjectSelector = useMemo(() => getEditedOrDefaultObjectSelector(objectID), [objectID]);
    const rawMarkdown = useSelector(state => editedOrDefaultObjectSelector(state).markdown.raw_text);
    const parsedMarkdown = useSelector(state => editedOrDefaultObjectSelector(state).markdown.parsed);

    const rawMarkdownOnChange = useMemo(() => raw_text => dispatch(setEditedObject({ markdown: { raw_text }}, objectID)), [objectID]);
    const onPostParse = useMemo(() => parsed => dispatch(setEditedObject({ markdown: { parsed }}, objectID)), [objectID]);

    return <MarkdownEditor headerText="Markdown" rawMarkdown={rawMarkdown} rawMarkdownOnChange={rawMarkdownOnChange}
        parsedMarkdown={parsedMarkdown} onPostParse={onPostParse} />
});
