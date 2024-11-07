import { FetchRunner } from "../fetch-runner";

import  { settingsViewResponseBody, type SettingNames } from "../types/data/settings";
import type { Dispatch, GetState } from "../../util/types/common";


/** Fetches current values of `setting_names` backend settings via `/settings/view` route. */
export const settingsViewFetch = (setting_names: SettingNames[], useAccessToken: boolean) => {
    return async (dispatch: Dispatch, getState: GetState) => {
        const runner = new FetchRunner("/settings/view", 
            { method: "POST", body: JSON.stringify({ setting_names })},
            { useAccessToken }
        );
        return await runner.run();
    };
}


/** Fetches current user registration setting value. */
export const registrationStatusFetch = () => {
    return async (dispatch: Dispatch, getState: GetState) => {
        const result = await dispatch(settingsViewFetch(["non_admin_registration_allowed"], false));
        if (result.failed) return false;
        const { non_admin_registration_allowed } = settingsViewResponseBody.parse(result.json).settings;
        if (non_admin_registration_allowed === undefined) throw Error("Response does not containe non_admin_registration_allowed setting.");
        return non_admin_registration_allowed;
    };
};


