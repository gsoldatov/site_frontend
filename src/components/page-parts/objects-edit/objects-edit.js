import React, { memo, useEffect, useMemo, useRef } from "react";
import { Header, Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { Layout } from "../../modules/layout/layout";
import { LoadIndicatorAndError, SaveError } from "../../modules/edit/placeholders";
import { AttributesTabPane } from "./attributes-tab-pane";
import { ObjectDataSwitch } from "../../state-users/objects-edit/data/object-data-switch";
import { DisplayTab } from "../../state-users/objects-edit/display/display-tab";

import { setSelectedTab, setToDoListRerenderPending } from "../../../actions/objects-edit";
import { isMultiColumnCompositeDataDisplayed } from "../../../store/state-util/composite";
import { enumLayoutTypes } from "../../../util/enums/enum-layout-types";


/**
 * /objects/edit/:id base component
 */
export const ObjectsEdit = ({ header, sideMenu, onLoad, objectID }) => {
    const dispatch = useDispatch();
    
    const enableStylesForMulticolumnCompositeObjectData = useSelector(isMultiColumnCompositeDataDisplayed);

    // On load action (also triggers when object ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [objectID]);

    // Set edited to-do list rerender to false, whenever it was toggled (flag is handled here to avoid multiple dispatch calls)
    const toDoListRerenderPending = useSelector(state => state.objectsEditUI.toDoListRerenderPending);
    useEffect(() => {
        if (toDoListRerenderPending) dispatch(setToDoListRerenderPending(false));
    }, [toDoListRerenderPending]);

    // Render loader/error or body
    const { isFetching, fetchError } = useSelector(state => state.objectsEditUI.objectOnLoadFetch);

    const body = isFetching || fetchError ?
        <LoadIndicatorAndError isFetching={isFetching} fetchError={fetchError} />
    : (
        <>
            <Header as="h1">{header}</Header>
            <ObjectSaveError />
            <ObjectTabPanes objectID={objectID} />
        </>
    );

    // Layout type (unlimited width for multicolumn object data)
    const layoutType = enableStylesForMulticolumnCompositeObjectData ? enumLayoutTypes.unlimitedWidth : enumLayoutTypes.default;

    return <Layout sideMenu={sideMenu} body={body} layoutType={layoutType} />;;
};


const ObjectTabPanes = memo(({ objectID }) => {
    const tabPanes = useMemo(() => {
        return [
            { menuItem: "General", render: () =>  <AttributesTabPane objectID={objectID} /> },
            { menuItem: "Data", render: () =>
                <Tab.Pane>
                    <ObjectDataSwitch objectID={objectID} />
                </Tab.Pane>
            },
            { menuItem: "Display", render: () =>
                <Tab.Pane>
                    <DisplayTab objectID={objectID} />
                </Tab.Pane>
            }
        ];
    }, [objectID]);

    const activeIndex = useSelector(state => state.objectsEditUI.selectedTab);
    const dispatch = useDispatch();
    const onTabChange = useRef((e, data) => {
        dispatch(setSelectedTab(data.activeIndex));
    }).current;

    return <Tab panes={tabPanes} activeIndex={activeIndex} onTabChange={onTabChange} />;
});


/**
 * Save fetch error message
 * */
const ObjectSaveError = () => {
    const fetchSelector = useMemo(() => state => state.objectsEditUI.objectOnSaveFetch, []);
    return <SaveError fetchSelector={fetchSelector} />;
};
