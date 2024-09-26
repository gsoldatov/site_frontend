import React, { memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { InlineItemListBlock, InlineItemListWrapper } from "../../inline/inline-item-list-containers";
import { InlineItemList } from "../../inline/inline-item-list";
import { InlineItem } from "../../inline/inline-item";
import { InlineInput } from "../../inline/inline-input";

import { setCurrentObjectsTags, setObjectsTagsInput  } from "../../../actions/objects-list";
import { objectsTagsDropdownFetch } from "../../../fetches/ui-objects-list";
import { commonTagIDsSelector, partiallyAppliedTagIDsSelector, existingIDsSelector, addedTagsSelector } from "../../../store/state-util/ui-objects-list";


/**
 * Common, added & partially applied tags for selected objects on the /objects/list page.
 */
export const SelectedObjectsTags = () => {
    const commonTagsWrapperIsDisplayedSelector = useMemo(() => state => state.objectsUI.selectedObjectIDs.length > 0, []);
    const partiallyAppliedTagsWrapperIsDisplayedSelector = useMemo(() => state => partiallyAppliedTagIDsSelector(state).length > 0, []);
    const inputStateSelector = useMemo(() => state => state.objectsUI.tagsInput, []);
    const inlineInputDropdownItemTextSelectors = useMemo(() => ({ itemStoreSelector: state => state.tags, itemTextSelector: (store, id) => store[id].tag_name }), []);
    // const renderBlock = useSelector(commonTagsWrapperIsDisplayedSelector) || useSelector(partiallyAppliedTagsWrapperIsDisplayedSelector);
    const shouldRenderCommonTags = useSelector(commonTagsWrapperIsDisplayedSelector);
    const shouldRenderPartiallyAppliedTags = useSelector(partiallyAppliedTagsWrapperIsDisplayedSelector)

    return (shouldRenderCommonTags || shouldRenderPartiallyAppliedTags) && (
        <InlineItemListBlock>
            <InlineItemListWrapper header="Common Tags" isDisplayedSelector={commonTagsWrapperIsDisplayedSelector}>
                <InlineItemList itemIDSelector={commonTagIDsSelector} ItemComponent={CommonCurrentTagItem} />
                <InlineItemList itemIDSelector={addedTagsSelector} ItemComponent={AddedTagItem} />
                {/* <InlineInput inputStateSelector={inputStateSelector} setInputState={setObjectsTagsInput} inputPlaceholder="Enter tag name..." onChangeDelayed={objectsTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} getItemTextSelector={getItemTextSelector} setItem={setCurrentObjectsTags} /> */}
                <InlineInput placeholder="Enter tag name..." inputStateSelector={inputStateSelector} setInputState={setObjectsTagsInput} onSearchChangeDelayed={objectsTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} setItem={setCurrentObjectsTags} getDropdownItemTextSelectors={inlineInputDropdownItemTextSelectors} />
            </InlineItemListWrapper>

            <InlineItemListWrapper header="Partially Applied Tags" isDisplayedSelector={partiallyAppliedTagsWrapperIsDisplayedSelector}>
                <InlineItemList itemIDSelector={partiallyAppliedTagIDsSelector} ItemComponent={PartiallyAppliedTagItem} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    )
};


const CommonCurrentTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    const className = isRemoved ? "deleted" : undefined;
    const URL = `/tags/view?tagIDs=${id}`;
    const icons = useMemo(() =>
        [{ 
            name: isRemoved ? "undo" : "remove", 
            title: isRemoved ? "Restore tag" : "Remove tag", 
            onClick: () => { dispatch(setCurrentObjectsTags({ removed: [id] })) } 
        }]
    , [id, isRemoved]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});


const AddedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => typeof(id) === "string" ? id : (state.tags[id] ? state.tags[id].tag_name : id));
    const className = typeof(id) === "number" ? "existing" : "new";
    const URL = typeof(id) === "number" ? `/tags/view?tagIDs=${id}` : undefined;
    const icons = useMemo(() => 
        [{ name: "remove", title: "Remove tag", onClick: () => { dispatch(setCurrentObjectsTags({ added: [id] })) }}]
    , [id]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});


const PartiallyAppliedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const isAdded = useSelector(state => state.objectsUI.addedTags.includes(id));
    const isRemoved = useSelector(state => state.objectsUI.removedTagIDs.includes(id));
    const className = isAdded ? "existing" : isRemoved ? "deleted" : undefined;
    const URL = `/tags/view?tagIDs=${id}`;
    const icons = useMemo(() =>
        [{ 
            name: isAdded ? "remove" : isRemoved ? "undo" : "plus",
            title: isAdded ? "Remove tag from all objects" : isRemoved ? "Restore tag" : "Tag all objects",
            onClick: isAdded ? () => dispatch(setCurrentObjectsTags({ added: [id], removed: [id] }))
                : isRemoved ? () => dispatch(setCurrentObjectsTags({ removed: [id] }))
                : () => dispatch(setCurrentObjectsTags({ added: [id] }))
        }]
    , [id, isAdded, isRemoved]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});
