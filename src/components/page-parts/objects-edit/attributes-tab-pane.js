import React, { memo, useMemo, useRef } from "react";
import { Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "reselect";

import { Timestamps, NameInput, DescriptionEditor } from "../../modules/edit/attributes";
import { ObjectTypeSelector } from "../../edit/objects-edit";
import { InlineItemListBlock, InlineItemListWrapper } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItem } from "../../modules/inline/inline-item";
import { InlineInput } from "../../modules/inline/inline-input";

import { getCurrentObject } from "../../../store/state-util/ui-objects-edit";
import { setEditedObject, setEditedObjectTags, setObjectTagsInput } from "../../../actions/objects-edit";
import { objectTagsDropdownFetch } from "../../../fetches/ui-objects-edit";


/**
 * /objects/edit/:id attributes & tags tab pane
 */
export const AttributesTabPane = ({ objectID }) => {
    return (
        <Tab.Pane className="objects-edit-general-tab">
            <ObjectTypeSelector objectID={objectID} />
            <ObjectTimestamps />
            <ObjectNameDescription />
            <ObjectTags />
        </Tab.Pane> 
    );
};


/**
 * Created at & modified at timestamps
 */
const ObjectTimestamps = () => {
    const createdAtSelector = useMemo(() => state => getCurrentObject(state).created_at, []);
    const modifiedAtSelector = useMemo(() => state => getCurrentObject(state).modified_at, []);
    const isDisplayedSelector = useMemo(() => state => state.objectUI.currentObjectID > 0, []);

    return (
        <Timestamps createdAtSelector={createdAtSelector} modifiedAtSelector={modifiedAtSelector} 
            isDisplayedSelector={isDisplayedSelector} />
    );
};


/**
 * Object name & description
 */
const ObjectNameDescription = () => {
    const dispatch = useDispatch();
    const name = useSelector(state => getCurrentObject(state).object_name);
    const description = useSelector(state => getCurrentObject(state).object_description);

    const nameOnChange = useRef(object_name => {
        dispatch(setEditedObject({ object_name }));
    }).current;

    const descriptionOnChange = useRef(object_description => {
        dispatch(setEditedObject({ object_description }));
    }).current;

    return (
        <>
            <NameInput label="Object Name" placeholder="Object name" value={name} onChange={nameOnChange} />
            <DescriptionEditor label="Object Description" placeholder="Object description" value={description} onChange={descriptionOnChange} />
        </>
    );
};


// Object's tags
const AddedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const className = typeof(id) === "number" ? "existing" : "new";
    const URL = typeof(id) === "number" ? `/tags/view?tagIDs=${id}` : undefined;
    const icons = useMemo(() => 
        [{ name: "remove", title: "Remove tag", onClick: () => dispatch(setEditedObjectTags({ added: [id] })) }]
    , [id]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});

const CurrentTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => getCurrentObject(state).removedTagIDs.includes(id));
    const className = isRemoved ? "deleted" : undefined;
    const URL = `/tags/view?tagIDs=${id}`;
    const icons = useMemo(() =>
        [{ 
            name: isRemoved ? "undo" : "remove", 
            title: isRemoved ? "Restore tag" : "Remove tag", 
            onClick: () => { dispatch(setEditedObjectTags({ removed: [id] })) } 
        }]
    , [id, isRemoved]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});

const ObjectTags = () => {
    const currentTagsSelector = useMemo(() => state => getCurrentObject(state).currentTagIDs, []);
    const addedTagsSelector = useMemo(() => state => getCurrentObject(state).addedTags, []);
    const inputStateSelector = useMemo(() => state => state.objectUI.tagsInput, []);
    
    const existingIDsSelector = useMemo(() => createSelector(
        state => getCurrentObject(state).currentTagIDs,
        state => getCurrentObject(state).addedTags,
        (currentTagIDs, addedTags) => currentTagIDs.concat(
            addedTags.filter(tag => typeof(tag) === "number")
        )
    ), []);

    // const getItemTextSelector = useMemo(() => id => state => state.tags[id] ? state.tags[id].tag_name : id, []);
    const inlineInputDropdownItemTextSelectors = useMemo(() => ({ itemStoreSelector: state => state.tags, itemTextSelector: (store, id) => store[id].tag_name }), []);

    return (
        <InlineItemListBlock header="Tags">
            <InlineItemListWrapper>
                <InlineItemList itemIDSelector={currentTagsSelector} ItemComponent={CurrentTagItem} />
                <InlineItemList itemIDSelector={addedTagsSelector} ItemComponent={AddedTagItem} />
                {/* <InlineInput inputStateSelector={inputStateSelector} setInputState={setObjectTagsInput} inputPlaceholder="Enter tag name..." onChangeDelayed={objectTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} getItemTextSelector={getItemTextSelector} setItem={setEditedObjectTags} /> */}
                <InlineInput placeholder="Enter tag name..." inputStateSelector={inputStateSelector} setInputState={setObjectTagsInput} onSearchChangeDelayed={objectTagsDropdownFetch} 
                    existingIDsSelector={existingIDsSelector} setItem={setEditedObjectTags} getDropdownItemTextSelectors={inlineInputDropdownItemTextSelectors} />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    );
};
