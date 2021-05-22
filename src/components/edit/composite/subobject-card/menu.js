import React from "react";
import { useSelector } from "react-redux";
import { Button, Menu } from "semantic-ui-react";


/*
    Subobject card top menu.
*/
const _tabIndexes = { "general": 0, "data": 1 };

export const CardMenu = ({ objectID, subobjectID, updateCallback }) => {
    const selectedTab = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID].selectedTab);
    const onTabChange = (e, data) => { updateCallback({ compositeUpdate: { command: "selectTab", subobjectID, selectedTab: _tabIndexes[data.name] }}); };

    return (
        <Menu attached="top" tabular size="mini">
            {/* <Menu.Item name="drag" active={false} color="grey" >{" "}</Menu.Item> */}

            <Menu.Item name="general" active={selectedTab === _tabIndexes["general"]} onClick={onTabChange}>
                General
            </Menu.Item>

            <Menu.Item name="data" active={selectedTab === _tabIndexes["data"]} onClick={onTabChange}>
                Data
            </Menu.Item>

            <Menu.Menu position="right">
                <Menu.Item>
                    <Button icon="undo" title="Test right menu item" basic size="mini" />
                </Menu.Item>
                <Menu.Item>
                    <Button icon="cancel" title="Test right menu item 2" basic size="mini" />
                </Menu.Item>
            </Menu.Menu>
        </Menu>
    );
};