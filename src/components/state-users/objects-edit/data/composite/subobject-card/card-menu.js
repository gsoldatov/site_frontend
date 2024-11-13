import React, { useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { Button, Menu } from "semantic-ui-react";

import { SubobjectDeleteMode } from "../../../../../../store/types/data/composite";

const _tabIndexes = { "general": 0, "data": 1, "display": 2 };


/**
 * Subobject card top menu.
 */
export const CardMenu = ({ objectID, subobjectID, updateCallback, isResetDialogDisplayed, setIsResetDialogDisplayed }) => {
    const dispatch = useDispatch();

    const selectedTab = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID].selected_tab);
    const isTabChangeDisabled = useSelector(state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode !== SubobjectDeleteMode.none);
    const onTabChange = (e, data) => { updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, selected_tab: _tabIndexes[data.name] }}); };

    // Menu button callbacks
    const resetSubbjectCallback = useMemo(() => () => { setIsResetDialogDisplayed(true) }, [objectID, subobjectID]);
    const deleteSubobjectCallback = useMemo(() => () => { 
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, deleteMode: SubobjectDeleteMode.subobjectOnly }}); 
    }, [objectID, subobjectID]);
    const fullyDeleteSubobjectCallback = useMemo(() => () => {
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, deleteMode: SubobjectDeleteMode.full }}); 
    }, [objectID, subobjectID]);
    const restoreDeletedSubobjectCallback = useMemo(() => () => { 
        updateCallback({ compositeUpdate: { command: "updateSubobject", subobjectID, deleteMode: SubobjectDeleteMode.none }}); 
    }, [objectID, subobjectID]);

    const secondaryMenuItemProps = useMemo(() => [
        {
            type: "link",
            icon: "edit outline", 
            title: "Open edit page of this object", 
            linkURL: `/objects/edit/${subobjectID}`,
            isVisibleSelector: state => subobjectID > 0
        },
        { 
            type: "button",
            icon: "undo", 
            title: "Reset object", 
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: resetSubbjectCallback
        },
        { 
            type: "button",
            icon: "trash alternate", 
            title: "Delete subobject", 
            isVisibleSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.none,
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: deleteSubobjectCallback
        },
        { 
            type: "button",
            icon: "trash alternate", 
            title: "Fully delete subobject", 
            color: "red",
            isVisibleSelector: state => subobjectID > 0 && state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode === SubobjectDeleteMode.none,
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: fullyDeleteSubobjectCallback
        },
        { 
            type: "button",
            icon: "undo", 
            title: "Restore deleted subobject", 
            color: "green",
            isVisibleSelector: state => state.editedObjects[objectID].composite.subobjects[subobjectID].deleteMode !== SubobjectDeleteMode.none,
            isDisabledSelector: state => isResetDialogDisplayed,
            onClick: restoreDeletedSubobjectCallback
        }
    ], [subobjectID]);

    const secondaryMenuItems = secondaryMenuItemProps.map((item, k) => {
        const isVisible = useSelector(item.isVisibleSelector || (state => true));
        const isDisabled = useSelector(item.isDisabledSelector || (state => false));
        return (
            <MenuItem key={k} type={item.type} isVisible={isVisible} isDisabled={isDisabled} icon={item.icon} color={item.color} title={item.title} 
                onClick={item.onClick} linkURL={item.linkURL} />
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

            <Menu.Item name="display" active={selectedTab === _tabIndexes["display"]} disabled={isTabChangeDisabled} onClick={onTabChange}>
                Display
            </Menu.Item>

            {secondaryMenuItems}
        </Menu>
    );
};


class MenuItem extends React.PureComponent {
    render() {
        const { type, isVisible, isDisabled, icon, color, title, onClick, linkURL } = this.props;

        
        let item;
        if (type === "button") {
            // Button
            item = <Button basic size="mini" icon={icon} color={color} title={title} disabled={isDisabled} onClick={onClick} />;
        } else if (type === "link") {
            // Link
            item = <Button basic size="mini" icon={icon} color={color} title={title} disabled={isDisabled} />;

            if (!isDisabled) {
                item = (
                    <Link to={linkURL} onClick={onClick}>
                        {item}
                    </Link>
                );
            }
        }

        let menuItemClassName = "composite-subobject-secondary-menu-item";
        if (type === "link") menuItemClassName += " link";

        return isVisible && (
            <Menu.Item className={menuItemClassName}>
               {item}
            </Menu.Item>
        );
    }
}