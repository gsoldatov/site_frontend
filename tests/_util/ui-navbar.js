import { queryByText } from "@testing-library/dom";


/**
 * Returns elements of navigation bar inside the `container`.
 */
export const getNavigationBarElements = container => {
    let navbarContainer = document.querySelector("div.navigation-bar.menu");
    if (!navbarContainer) return {};

    let indexLink = queryByText(navbarContainer, "Index");
    let objectsLink = queryByText(navbarContainer, "Objects");
    let editedObjectsLink = queryByText(navbarContainer, "Edited Objects");
    let tagsLink = queryByText(navbarContainer, "Tags");

    let secondaryMenu = navbarContainer.querySelector("div.navigation-right-menu");
    if (!secondaryMenu) return { navbarContainer, indexLink, objectsLink, editedObjectsLink, tagsLink };

    let profileLink = secondaryMenu.querySelector(".navigation-bar-username");
    let logoutButton = queryByText(secondaryMenu, "Logout");
    let loginButton = queryByText(secondaryMenu, "Login");
    let registerButton = queryByText(secondaryMenu, "Sign Up");

    return { navbarContainer, indexLink, objectsLink, editedObjectsLink, tagsLink,
        secondaryMenu: { profileLink, logoutButton, loginButton, registerButton }};
};
