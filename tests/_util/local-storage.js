import { getByPlaceholderText, waitFor } from "@testing-library/dom";


/**
 * Test utility function which returns a localStorage key for a given `objectID`.
 */
export const getEditedObjectLocalStorageKey = objectID => `editedObject_${objectID}`;


/**
 * Runs `waitFor` function which ensures that provided `authInfo` object is saved in the localStorage.
 */
export const waitForAuthInfoToBeSavedIntoLocalStorage = async authInfo => {
    await waitFor(() => {
        const savedAuthInfo = localStorage.getItem("authInfo");
        const parsedAuthInfo = JSON.parse(savedAuthInfo);

        expect(authInfo).toMatchObject(parsedAuthInfo);
        expect(parsedAuthInfo).toMatchObject(authInfo);
    });
};