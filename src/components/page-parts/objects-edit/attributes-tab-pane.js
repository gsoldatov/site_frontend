import React, { memo, useMemo } from "react";
import { Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { Timestamps, NameInput, DescriptionEditor } from "../../modules/edit/attributes";
import { ObjectTypeSelector } from "../../state-users/objects-edit/attributes/object-type-selector";
import { InlineItemListContainer } from "../../modules/inline/inline-item-list-containers";
import { InlineItemList } from "../../modules/inline/inline-item-list";
import { InlineItem } from "../../modules/inline/inline-item";
import { InlineInput } from "../../modules/inline/inline-input";

import { ObjectsEditSelectors } from "../../../store/selectors/ui/objects-edit";
import { updateEditedObject, updateEditedObjectTags } from "../../../reducers/data/edited-objects";
import { setObjectsEditTagsInput } from "../../../reducers/ui/objects-edit";
import { objectsEditTagsDropdownFetch } from "../../../fetches/ui-objects-edit";


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
    const createdAt = useSelector(state => ObjectsEditSelectors.currentObject(state).created_at);
    const modifiedAt = useSelector(state => ObjectsEditSelectors.currentObject(state).modified_at);
    const isDisplayed = useSelector(state => state.objectsEditUI.currentObjectID > 0);

    if (!isDisplayed) return null;

    return <Timestamps createdAt={createdAt} modifiedAt={modifiedAt} />;
};


/**
 * Object name & description
 */
const ObjectNameDescription = () => {
    const dispatch = useDispatch();
    const currentObjectID = useSelector(state => state.objectsEditUI.currentObjectID);
    const name = useSelector(state => ObjectsEditSelectors.currentObject(state).object_name);
    const description = useSelector(state => ObjectsEditSelectors.currentObject(state).object_description);

    const nameOnChange = useMemo(() => object_name => {
        dispatch(updateEditedObject(currentObjectID, { object_name }));
    }, [currentObjectID]);

    const descriptionOnChange = useMemo(() => object_description => {
        dispatch(updateEditedObject(currentObjectID, { object_description }));
    }, [currentObjectID]);

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
        <InlineItemListContainer header="Tags" bordered>
            <CurrentTags />
            <AddedTags />
            <NewTagInput />
        </InlineItemListContainer>
    );
};


const CurrentTags = () => {
    const itemIDs = useSelector(state => ObjectsEditSelectors.currentObject(state).currentTagIDs);
    return <InlineItemList itemIDs={itemIDs} ItemComponent={CurrentTagItem} />;
};


const AddedTags = () => {
    const itemIDs = useSelector(state => ObjectsEditSelectors.currentObject(state).addedTags);
    return <InlineItemList itemIDs={itemIDs} ItemComponent={AddedTagItem} />;
};


const NewTagInput = () => {
    const dispatch = useDispatch();
    const inputState = useSelector(state => state.objectsEditUI.tagsInput);
    const currentObjectID = useSelector(state => state.objectsEditUI.currentObjectID);
    
    const setInputState = useMemo(() => newState => dispatch(setObjectsEditTagsInput(newState)), []);
    const setItem = useMemo(() => params => dispatch(updateEditedObjectTags(currentObjectID, params)), [currentObjectID]);
    const onSearchChangeDelayed = useMemo(() => (queryText, existingIDs) => dispatch(objectsEditTagsDropdownFetch(queryText, existingIDs)), []);

    const existingIDs = useSelector(ObjectsEditSelectors.existingTagIDs);
    const matchingIDsText = useSelector(ObjectsEditSelectors.matchingTagIDsName);

    return <InlineInput placeholder="Enter tag name..." inputState={inputState} setInputState={setInputState} setItem={setItem}
        existingIDs={existingIDs} matchingIDsText={matchingIDsText} onSearchChangeDelayed={onSearchChangeDelayed} />;
};


const CurrentTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const currentObjectID = useSelector(state => state.objectsEditUI.currentObjectID);
    const text = useSelector(state => state.tags[id] ? state.tags[id].tag_name : "?");
    const isRemoved = useSelector(state => ObjectsEditSelectors.currentObject(state).removedTagIDs.includes(id));
    const className = isRemoved ? "deleted" : undefined;
    const URL = `/tags/view?tagIDs=${id}`;
    const icons = useMemo(() =>
        [{ 
            name: isRemoved ? "undo" : "remove", 
            title: isRemoved ? "Restore tag" : "Remove tag", 
            onClick: () => { dispatch(updateEditedObjectTags(currentObjectID, { removed: [id] })) } 
        }]
    , [currentObjectID, id, isRemoved]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});



const AddedTagItem = memo(({ id }) => {
    const dispatch = useDispatch();

    const currentObjectID = useSelector(state => state.objectsEditUI.currentObjectID);
    const text = useSelector(state => typeof(id) === "string" ? id : state.tags[id] ? state.tags[id].tag_name : id);
    const className = typeof(id) === "number" ? "existing" : "new";
    const URL = typeof(id) === "number" ? `/tags/view?tagIDs=${id}` : undefined;
    const icons = useMemo(() => 
        [{ name: "remove", title: "Remove tag", onClick: () => dispatch(updateEditedObjectTags(currentObjectID, { added: [id] })) }]
    , [currentObjectID, id]);

    return <InlineItem text={text} className={className} URL={URL} icons={icons} />;
});
