import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Icon } from "semantic-ui-react";

import { SubobjectObjectsViewCard } from "../objects-view-card";

import { objectsViewMulticolumnExpandToggleUpdateFetch } from "../../../../fetches/ui/objects-view";

import { CompositeSelectors } from "../../../../store/selectors/data/objects/composite";
import { debounce } from "../../../../util/debounce";

import StyleCompositeMulticolumn from "../../../../styles/pages/objects-view/composite-multicolumn.css";


/**
 * Multicolumn composite object's object data display component in <ObjectsViewCard>.
 */
export const CompositeMulticolumn = ({ objectID }) => {
    const composite = useSelector(state => state.composite[objectID]);
    const subobjectOrder = CompositeSelectors.getSubobjectDisplayOrder(composite, true);
    
    const columns = subobjectOrder.map((columnSubobjectIDs, k) => <Column key={k} objectID={objectID} subobjectIDs={columnSubobjectIDs} />);

    return (
        <div className="objects-view-data composite-multicolumn">
            {columns}
        </div>
    );
};


/**
 * A single column in multicolumn object.
 */
const Column = ({ objectID, subobjectIDs }) => {
    const subobjectCards = subobjectIDs.map((subobjectID, key) => <MulticolumnSubobjectCard key={key} objectID={objectID} subobjectID={subobjectID} />);

    return (
        <div className="objects-view-data-composite-multicolumn-column">
            {subobjectCards}
        </div>
    );
};


/**
 * Multicolumn subobject card (wrapped into expand/collapse toggle).
 */
const MulticolumnSubobjectCard = ({ objectID, subobjectID }) => {
    const dispatch = useDispatch();
    const isExpanded_ = useSelector(state => state.composite[objectID].subobjects[subobjectID].is_expanded);
    const [isExpanded, setIsExpanded] = useState(isExpanded_);

    // Expand toggle text
    const objectName = useSelector(state => subobjectID in state.objects ? state.objects[subobjectID].object_name : "");
    const toggleText = isExpanded ? "" : objectName;

    // Expand toggle handler
    const expandOnClick = useMemo(() => () => {
        setIsExpanded(!isExpanded);
        updateFetch(!isExpanded);
    }, [isExpanded]);

    // Debounced fetch, which updates `is_expanded` prop of the toggled subobject
    const updateFetch = useMemo(() => debounce(async is_expanded => {
        await dispatch(objectsViewMulticolumnExpandToggleUpdateFetch(objectID, subobjectID, is_expanded));
    }, 100, "onCall"), [objectID, subobjectID]);

    // Render
    const toggle = (
        <div className="objects-view-data-expand-toggle" onClick={expandOnClick}>
            <Icon name="dropdown" />
            <span>{toggleText}</span>
        </div>
    );

    const content = (   // always render, so that there's no lag caused by markdown being rendered when card is expanded
        <div className="objects-view-data-expand-toggle-content">
            <SubobjectObjectsViewCard objectID={objectID} subobjectID={subobjectID} classNames={["multicolumn-subobject"]} />
        </div>
    );

    const containerClassName = "objects-view-data-expand-toggle-container" + (isExpanded ? " expanded" : "");

    return (
        <div className={containerClassName}>
            {toggle}
            {content}
        </div>
        
    )
};