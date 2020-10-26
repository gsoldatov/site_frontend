import React from "react";
import SideMenuItemContainer from "../side-menu/side-menu-item-container";
import { addObjectOnSaveFetch, setObjectRedirectOnRender } from "../../actions/object";
import { isFetchingObject } from "../../store/state-check-functions";

/*
    Side menu item factory for the add object page.
*/
function getAddObjectPageSideMenuItems() {
    let key = 0;

    return [
        <SideMenuItemContainer 
            itemJSX="Save" 
            isVisible={true} 
            isActive={ state =>
                    !isFetchingObject(state) && 
                    state.objectUI.currentObject.object_name.length >= 1 && state.objectUI.currentObject.object_name.length <= 255
            }
            onClick={ addObjectOnSaveFetch() }
            key={key++}
        />,
        <SideMenuItemContainer 
            itemJSX="Cancel" 
            isVisible={true} 
            isActive={ state => !isFetchingObject(state) }
            onClick={ setObjectRedirectOnRender("/objects") }
            key={key++}
        />
    ];
}

export default getAddObjectPageSideMenuItems;