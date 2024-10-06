import React, { memo, useMemo, useRef } from "react";
import { Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { Timestamps, NameInput, DescriptionEditor } from "../../modules/edit/attributes";
import { ObjectTypeSelector } from "../../state-users/objects-edit/attributes/object-type-selector";
import { InlineItemListBlock, InlineItemListWrapper } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItem } from "../../modules/inline/inline-item";
import { InlineInput } from "../../modules/inline/inline-input";

import { getCurrentObject, existingIDsSelector, matchingTagIDsNames } from "../../../store/state-util/ui-objects-edit";
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
    const createdAt = useSelector(state => getCurrentObject(state).created_at);
    const modifiedAt = useSelector(state => getCurrentObject(state).modified_at);
    const isDisplayed = useSelector(state => state.objectUI.currentObjectID > 0);

    if (!isDisplayed) return null;

    return <Timestamps createdAt={createdAt} modifiedAt={modifiedAt} />;
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


/**
 * Object's tags
 */
const ObjectTags = () => {
    return (
        <InlineItemListBlock header="Tags">
            <InlineItemListWrapper>
                <CurrentTags />
                <AddedTags />
                <NewTagInput />
            </InlineItemListWrapper>
        </InlineItemListBlock>
    );
};


const CurrentTags = () => {
    const itemIDs = useSelector(state => getCurrentObject(state).currentTagIDs);
    return <InlineItemList itemIDs={itemIDs} ItemComponent={CurrentTagItem} />;
};


const AddedTags = () => {
    const itemIDs = useSelector(state => getCurrentObject(state).addedTags);
    return <InlineItemList itemIDs={itemIDs} ItemComponent={AddedTagItem} />;
};


const NewTagInput = () => {
    const dispatch = useDispatch();
    const inputState = useSelector(state => state.objectUI.tagsInput);
    
    const setInputState = useMemo(() => newState => dispatch(setObjectTagsInput(newState)), []);
    const setItem = useMemo(() => params => dispatch(setEditedObjectTags(params)), []);
    const onSearchChangeDelayed = useMemo(() => params => dispatch(objectTagsDropdownFetch(params)), []);

    existingIDsSelector
    const existingIDs = useSelector(existingIDsSelector);
    const matchingIDsText = useSelector(matchingTagIDsNames);

    return <InlineInput placeholder="Enter tag name..." inputState={inputState} setInputState={setInputState} setItem={setItem}
        existingIDs={existingIDs} matchingIDsText={matchingIDsText} onSearchChangeDelayed={onSearchChangeDelayed} />;
};


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
