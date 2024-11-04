import React, { memo, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { InlineBlock, InlineItemListContainer } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItem } from "../../modules/inline/inline-item";
import { InlineInput } from "../../modules/inline/inline-input";

import { setCurrentObjectsTags, setObjectsTagsInput  } from "../../../actions/objects-list";
import { objectsTagsDropdownFetch } from "../../../fetches/ui-objects-list";
import { commonTagIDsSelector, partiallyAppliedTagIDsSelector, existingTagIDsSelector, addedTagsSelector, matchingTagIDsNames } from "../../../store/state-util/ui-objects-list";


/**
 * Common, added & partially applied tags for selected objects on the /objects/list page.
 */
export const SelectedObjectsTags = () => {
    const isVisible = useSelector(state => state.objectsListUI.selectedObjectIDs.length > 0 || partiallyAppliedTagIDsSelector(state).length > 0);
    if (!isVisible) return null;

    return (
        <InlineBlock bordered>
            <CommonTags />
            <PartiallyAppliedTags />
        </InlineBlock>
    )
};


/**
 * Common existing & added tags inline item lists.
 */
const CommonTags = () => {
    const isVisible = useSelector(state => state.objectsListUI.selectedObjectIDs.length > 0);
    if (!isVisible) return null;

    return (
        <InlineItemListContainer header="Common Tags">
            <ExistingTagsList />
            <AddedTagsList />
            <NewTagInput />
        </InlineItemListContainer>
    );
};


const ExistingTagsList = () => {
    const itemIDs = useSelector(commonTagIDsSelector);
    return <InlineItemList itemIDs={itemIDs} ItemComponent={CommonCurrentTagItem} />
};


const AddedTagsList = () => {
    const itemIDs = useSelector(addedTagsSelector);
    return <InlineItemList itemIDs={itemIDs} ItemComponent={AddedTagItem} />;
};


const NewTagInput = () => {
    const dispatch = useDispatch();
    const inputState = useSelector(state => state.objectsListUI.tagsInput);
    
    const setInputState = useMemo(() => newState => dispatch(setObjectsTagsInput(newState)), []);
    const setItem = useMemo(() => params => dispatch(setCurrentObjectsTags(params)), []);
    const onSearchChangeDelayed = useMemo(() => params => dispatch(objectsTagsDropdownFetch(params)), []);

    const existingIDs = useSelector(existingTagIDsSelector);
    const matchingIDsText = useSelector(matchingTagIDsNames);

    return <InlineInput placeholder="Enter tag name..." inputState={inputState} setInputState={setInputState} setItem={setItem}
        existingIDs={existingIDs} matchingIDsText={matchingIDsText} onSearchChangeDelayed={onSearchChangeDelayed} />;
};


/**
 * Common existing & added tags inline item lists.
 */
const PartiallyAppliedTags = () => {
    const isVisible = useSelector(state => partiallyAppliedTagIDsSelector(state).length > 0);
    const itemIDs = useSelector(partiallyAppliedTagIDsSelector);
    
    if (!isVisible) return null;

    return (
        <InlineItemListContainer header="Partially Applied Tags">
            <InlineItemList itemIDs={itemIDs} ItemComponent={PartiallyAppliedTagItem} />
        </InlineItemListContainer>
    );
};


const CommonCurrentTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => state.objectsListUI.removedTagIDs.includes(id));
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
    const isAdded = useSelector(state => state.objectsListUI.addedTags.includes(id));
    const isRemoved = useSelector(state => state.objectsListUI.removedTagIDs.includes(id));
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
