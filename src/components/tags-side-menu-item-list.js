import React from "react";

import SideMenuItemContainer from "./side-menu-item-container";
// import SideMenuDialogContainer from "./side-menu-dialog-container";
// import SideMenuDialogButtonContainer from "./side-menu-dialog-button-container";

import { setTagsRedirectOnRender } from "../actions/tags";
// import { isFetchingTag, isFetchinOrShowingDialogTag } from "../store/state-check-functions";

/*
    Side menu item factory for the tags page.
*/
function getTagsPageSideMenuItems() {
    let key = 0;

    return [
        <SideMenuItemContainer 
            itemJSX="Add Tag" 
            isVisible={true} 
            isActive={true}
            onClick={ setTagsRedirectOnRender("/tags/add") }
            key={key++}
        />,

        <SideMenuItemContainer 
            itemJSX="Edit Tag" 
            isVisible={true} 
            isActive={ state => state.tagsUI.selectedTagIDs}
            onClick={ () => console.log("Clicked edit tag button") }
            key={key++}
        />,

        <SideMenuItemContainer 
            itemJSX="Delete Tags" 
            isVisible={true} 
            isActive={true}
            onClick={ () => console.log("Clicked delete tags button") }
            key={key++}
        />
    ];
}

export default getTagsPageSideMenuItems;
