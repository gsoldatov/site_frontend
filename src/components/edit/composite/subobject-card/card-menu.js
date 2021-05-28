import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Button, Menu } from "semantic-ui-react";


/*
    Subobject card top menu.
*/
const _tabIndexes = { "general": 0, "data": 1 };

export const CardMenu = ({ objectID, subobjectID, updateCallback }) => {
    const selectedTab = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID].selectedTab);
    const onTabChange = (e, data) => { updateCallback({ compositeUpdate: { command: "selectTab", subobjectID, selectedTab: _tabIndexes[data.name] }}); };

    const secondaryMenuButtonProps = useMemo(() => [
        { 
            icon: "edit outline", title: "Edit object page", 
            isDisabledSelector: state => false, 
            isVisibleSelector: state => true, 
            onClick: () => console.log("Clicked button 1") },
        { 
            icon: "undo", title: "Reset object", 
            isDisabledSelector: state => true, 
            isVisibleSelector: state => true, 
            onClick: () => console.log("Clicked button 2") 
        },
        { 
            icon: "trash alternate", title: "Delete object", 
            isDisabledSelector: state => false, 
            isVisibleSelector: state => true, 
            onClick: () => console.log("Clicked button 3") 
        },
        { 
            icon: "trash alternate", title: "Delete object", 
            isDisabledSelector: state => false, 
            isVisibleSelector: state => false, 
            onClick: () => console.log("Clicked button 3") 
        }
    ], [objectID, subobjectID]);

    const menuButtonsIsVisible = secondaryMenuButtonProps.map(btn => useSelector(btn.isVisibleSelector));
    const menuButtonsIsDisabled = secondaryMenuButtonProps.map(btn => useSelector(btn.isDisabledSelector));

    const secondaryMenuButtons = secondaryMenuButtonProps.map((btn, k) =>
        menuButtonsIsVisible[k] && (
            <Menu.Item key={k} className="composite-subobject-secondary-menu-item">
                <Button basic size="mini" icon={btn.icon} title={btn.title} disabled={menuButtonsIsDisabled[k]} onClick={btn.onClick} />
            </Menu.Item>
        )
    );

    return (
        <Menu secondary size="mini" className="composite-subobject-card-menu">
            <Menu.Item name="general" active={selectedTab === _tabIndexes["general"]} onClick={onTabChange}>
                General
            </Menu.Item>

            <Menu.Item name="data" active={selectedTab === _tabIndexes["data"]} onClick={onTabChange}>
                Data
            </Menu.Item>

            <Menu.Menu className="composite-subobject-card-secondary-sub-menu">
                {secondaryMenuButtons}
            </Menu.Menu>
        </Menu>
    );
};