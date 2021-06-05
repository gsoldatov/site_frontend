import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button, Menu } from "semantic-ui-react";

import { setRedirectOnRender } from "../../../../actions/common";
import { enumDeleteModes } from "../../../../store/state-templates/composite-subobjects";


/*
    Subobject card top menu.
*/
const _tabIndexes = { "general": 0, "data": 1 };

export const CardMenu = ({ objectID, subobjectID, updateCallback, isResetDialogDisplayed, setIsResetDialogDisplayed }) => {
    const dispatch = useDispatch();

    const selectedTab = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID].selected_tab);
    const isTabChangeDisabled = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode !== enumDeleteModes.none);
    const onTabChange = (e, data) => { updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, selected_tab: _tabIndexes[data.name] }}); };

    // Menu button callbacks
    const editObjectPageCallback = useMemo(() => () => {
        dispatch(setRedirectOnRender(`/objects/${subobjectID}`))
    }, [objectID, subobjectID]);
    const resetSubbjectCallback = useMemo(() => () => { setIsResetDialogDisplayed(true) }, [objectID, subobjectID]);
    const deleteSubobjectCallback = useMemo(() => () => { 
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, deleteMode: enumDeleteModes.subobjectOnly }}); 
    }, [objectID, subobjectID]);
    const fullyDeleteSubobjectCallback = useMemo(() => () => {
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, deleteMode: enumDeleteModes.full }}); 
    }, [objectID, subobjectID]);
    const restoreDeletedSubobjectCallback = useMemo(() => () => { 
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, deleteMode: enumDeleteModes.none }}); 
    }, [objectID, subobjectID]);

    const secondaryMenuButtonProps = [
        { 
            icon: "edit outline", 
            title: "Open edit page of this object", 
            onClick: editObjectPageCallback,
            isVisibleSelector: state => subobjectID > 0
        },
        { 
            icon: "undo", 
            title: "Reset object", 
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: resetSubbjectCallback
        },
        { 
            icon: "trash alternate", 
            title: "Delete subobject", 
            isVisibleSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.none,
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: deleteSubobjectCallback
        },
        { 
            icon: "trash alternate", 
            title: "Fully delete subobject", 
            color: "red",
            isVisibleSelector: state => subobjectID > 0 && state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === enumDeleteModes.none,
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: fullyDeleteSubobjectCallback
        },
        { 
            icon: "undo", 
            title: "Restore deleted subobject", 
            color: "green",
            isVisibleSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode !== enumDeleteModes.none,
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: restoreDeletedSubobjectCallback
        }
    ];

    const secondaryMenuButtons = secondaryMenuButtonProps.map((btn, k) => {
        const isVisible = useSelector(btn.isVisibleSelector || (state => true));
        const isDisabled = useSelector(btn.isDisabledSelector || (state => false));
        return (
            <MenuButton key={k} isVisible={isVisible} isDisabled={isDisabled} icon={btn.icon} color={btn.color} title={btn.title} onClick={btn.onClick} />
        );
    });

    return (
        <Menu secondary size="mini" className="composite-subobject-card-menu">
            <Menu.Item name="general" active={selectedTab === _tabIndexes["general"]} disabled={isTabChangeDisabled} onClick={onTabChange} >
                General
            </Menu.Item>

            <Menu.Item name="data" active={selectedTab === _tabIndexes["data"]} disabled={isTabChangeDisabled} onClick={onTabChange}>
                Data
            </Menu.Item>

            {secondaryMenuButtons}
        </Menu>
    );
};


class MenuButton extends React.PureComponent {
    render() {
        const { isVisible, isDisabled, icon, color, title, onClick } = this.props;

        return isVisible && (
            <Menu.Item className="composite-subobject-secondary-menu-item">
               <Button basic size="mini" icon={icon} color={color} title={title} disabled={isDisabled} onClick={onClick} />
            </Menu.Item>
        );
    }
}