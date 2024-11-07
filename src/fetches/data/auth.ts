import { FetchRunner } from "../fetch-runner";

import type { Dispatch, GetState } from "../../util/types/common";
import { getRegisterFetchDataValidationErrors, registerFetchData, registerFetchValidationErrors } from "../types/data/auth";

import type { RegisterFetchValidationErrors } from "../types/data/auth";


export const registerFetch = (login: string, password: string, password_repeat: string, username: string) => {
    return async (dispatch: Dispatch, getState: GetState): Promise<RegisterFetchValidationErrors> => {
        // Validate user data
        const parseResult = registerFetchData.safeParse({ login, password, password_repeat, username });
        if (!parseResult.success) return getRegisterFetchDataValidationErrors(parseResult.error);

        // Fetch backend
        const runner = new FetchRunner("/auth/register", {
            method: "POST",
            body: JSON.stringify(parseResult.data)
        });
        let result = await runner.run();

        // Handle response
        switch (result.status) {
            case 200:
                return {};
            default:
                // Attribute backend error message to a specific form field or return a form error
                const errors = {} as any;
                const match = result.error!.match(/Submitted (\w+) already exists./);
                if (match && ["login", "username"].includes(match[1])) errors[match[1]] = match[0];
                else errors.form = result.error;
                return registerFetchValidationErrors.parse({ errors });
        }
    };
};
