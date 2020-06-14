import React from "react";
import SideMenuItemContainer from "./side-menu-item-container";
import { addTagOnSaveFetch, setRedirectOnRender } from "../actions/tag";
import { isFetchingTag } from "../store/state-check-functions";

/*
    Side menu item factory for the add tag page.
*/
function getAddTagPageSideMenuItems() {
    let key = 0;

    return [
        <SideMenuItemContainer 
            itemJSX="Save" 
            isVisible={true} 
            isActive={ state =>
                    !isFetchingTag(state) && 
                    state.tagUI.currentTag.tag_name.length >= 1 && state.tagUI.currentTag.tag_name.length <= 255
            }
            onClick={ addTagOnSaveFetch() }
            key={key++}
        />,
        <SideMenuItemContainer 
            itemJSX="Cancel" 
            isVisible={true} 
            isActive={ state => !isFetchingTag(state) }
            onClick={ setRedirectOnRender("/tags") }
            key={key++}
        />
    ];
}

export default getAddTagPageSideMenuItems;