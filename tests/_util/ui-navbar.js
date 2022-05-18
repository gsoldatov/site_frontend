import { queryByText } from "@testing-library/dom";


/**
 * Returns elements of navigation bar inside the `container`.
 */
export const getNavigationBarElements = container => {
    const result = {
        navbarContainer: null,
        indexLink: null,
        objectsLink: null,          // NOTE: objects & editedObjects are now in submenu (updates may be required to properly emulate submenu clicking logic)
        editedObjectsLink: null,
        tagsLink: null,

        search: {
            input: null,
            button: null
        },

        secondaryMenu: {
            container: null,
            profileLink: null,
            logoutButton: null,
            loginButton: null,
            registerButton: null
        }
    }

    const navbarContainer = container.querySelector("div.navigation-bar.menu");
    if (navbarContainer) {
        result.navbarContainer = navbarContainer;
        result.indexLink = queryByText(navbarContainer, "Index");
        result.objectsLink = queryByText(navbarContainer, "Objects");
        result.editedObjectsLink = queryByText(navbarContainer, "Edited Objects");
        result.tagsLink = queryByText(navbarContainer, "Tags");

        const searchContainer = navbarContainer.querySelector(".navbar-search-container");
        if (searchContainer) {
            result.search.input = searchContainer.querySelector("input");
            result.search.button = searchContainer.querySelector("button");
        }

        const secondaryMenu = navbarContainer.querySelector("div.navigation-right-menu");
        if (secondaryMenu) {
            result.secondaryMenu.container = secondaryMenu;
            result.secondaryMenu.profileLink = secondaryMenu.querySelector(".navigation-bar-username");
            result.secondaryMenu.logoutButton = queryByText(secondaryMenu, "Logout");
            result.secondaryMenu.loginButton = queryByText(secondaryMenu, "Login");
            result.secondaryMenu.registerButton = queryByText(secondaryMenu, "Sign Up");
        }
    }
    
    return result;
};
