import React, { useEffect, useMemo, useRef } from "react";
import { Header, Tab } from "semantic-ui-react";
import { useDispatch, useSelector } from "react-redux";

import { Layout } from "../../modules/layout/layout";
import { LoadIndicatorAndError, SaveError } from "../../edit/common/edit-page";
import { AttributesTabPane } from "./attributes-tab-pane";
import { ObjectViewEditSwitch } from "../../edit/objects-edit";
import { DisplayTab } from "../../edit/objects-edit-display-controls/display-tab";

import { setSelectedTab } from "../../../actions/objects-edit";
import { isMultiColumnCompositeDataDisplayed } from "../../../store/state-util/composite";
import { enumLayoutTypes } from "../../../util/enum-layout-types";


/**
 * /objects/edit/:id base component
 */
export const ObjectsEdit = ({ header, sideMenuItems, onLoad, objectID }) => {
    const dispatch = useDispatch();
    
    const enableStylesForMulticolumnCompositeObjectData = useSelector(isMultiColumnCompositeDataDisplayed);

    // On load action (also triggers when object ids change)
    useEffect(() => {
        dispatch(onLoad);
    }, [objectID]);

    // Render loader/error or body
    const { isFetching, fetchError } = useSelector(state => state.objectUI.objectOnLoadFetch);

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

    return <Layout sideMenuItems={sideMenuItems} body={body} layoutType={layoutType} />;;
};


const ObjectTabPanes = ({ objectID }) => {
    const tabPanes = useMemo(() => {
        return [
            { menuItem: "General", render: () =>  <AttributesTabPane objectID={objectID} /> },
            { menuItem: "Data", render: () =>
                <Tab.Pane>
                    <ObjectViewEditSwitch objectID={objectID} />
                </Tab.Pane>
            },
            { menuItem: "Display", render: () =>
                <Tab.Pane>
                    <DisplayTab objectID={objectID} />
                </Tab.Pane>
            }
        ];
    }, [objectID]);

    const activeIndex = useSelector(state => state.objectUI.selectedTab);
    const dispatch = useDispatch();
    const onTabChange = useRef((e, data) => {
        dispatch(setSelectedTab(data.activeIndex));
    }).current;

    return <Tab panes={tabPanes} activeIndex={activeIndex} onTabChange={onTabChange} />;
};


/**
 * Save fetch error message
 * */
const ObjectSaveError = () => {
    const fetchSelector = useMemo(() => state => state.objectUI.objectOnSaveFetch, []);
    return <SaveError fetchSelector={fetchSelector} />;
};
