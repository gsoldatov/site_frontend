import { FetchRunner } from "../fetch-runner";

import  { settingsViewResponseBody, settingsViewAllResponsebody } from "../types/data/settings";

import type { SettingNames, SettingsViewAllFetchResult } from "../types/data/settings";
import type { Dispatch, GetState } from "../../util/types/common";
import type { FetchResult } from "../fetch-runner";


/** Fetches current values of `setting_names` backend settings via `/settings/view` route. */
export const settingsViewFetch = (setting_names: SettingNames[], useAccessToken: boolean) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<FetchResult> => {
        const runner = new FetchRunner("/settings/view", 
            { method: "POST", body: { setting_names }},
            { useAccessToken }
        );
        return await runner.run();
    };
};


/** Fetches all backend settings via /`settings/view` route. */
export const settingsViewAllFetch = () => {
    return async (dispatch: Dispatch, getState: GetState): Promise<SettingsViewAllFetchResult> => {
        const runner = new FetchRunner("/settings/view", 
            { method: "POST", body: { view_all: true }}
        );
        const result = await runner.run();
        
        switch (result.status) {
            case 200:
                (result as SettingsViewAllFetchResult).settings = settingsViewAllResponsebody.parse(result.json).settings;
                return result;
            default:
                return result;
        }
    };
};


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
