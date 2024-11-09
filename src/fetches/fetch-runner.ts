import { z } from "zod";

import { setAuthInformation } from "../reducers/data/auth";
import { getDefaultAuthState } from "../store/types/data/auth";
import { getConfig } from "../config";
import { getFromDocumentApp } from "../util/document-app";

import { int } from "../util/types/common";


const { backendURL } = getConfig();


/**
 * Helper class for running fetches to backend.
 *
 * Handles auth token validity & network errors.
 */
export class FetchRunner {
    URL: string
    init: RequestInit
    useAccessToken: boolean


    constructor(URL: string, init: RequestInitWithObjectBody = {}, options: FetchRunnerOptions = {}) {
        const {
            useAccessToken = true,
            contentTypeJSON = true,
            URLPrefix = backendURL
        } = options;

        this.URL = `${URLPrefix}${URL}`;

        // NOTE: this might need a rework, if permitted by fetch spec objects are passed a body (https://developer.mozilla.org/en-US/docs/Web/API/RequestInit)
        if (init.body instanceof Object) this.init = { ...init, body: JSON.stringify(init.body) };
        else this.init = init as RequestInit;

        if (contentTypeJSON) {
            // Add content type header (currently set for all backend fetches)
            this.init.headers = (this.init.headers || {}) as Record<string, any>;
            this.init.headers["Content-Type"] = "application/json";
        }

        this.useAccessToken = useAccessToken;
    }

    /** Validates and adds access token to request, if it's used. */
    private addAccessTokenToRequest() {
        if (!this.useAccessToken) return;
        const state = getFromDocumentApp("store").getState();

        // Check if access token expired
        if (state.auth.access_token_expiration_time.length > 0 && (new Date(state.auth.access_token_expiration_time)).getTime() <= Date.now()) {
            getFromDocumentApp("store").dispatch(setAuthInformation(getDefaultAuthState()));
            throw new TokenValidationError("Invalid token.");
        }

        // Add 'Authorization' header if a token is present
        if (state.auth.access_token.length > 0)
            (this.init.headers as Record<string, any>)["Authorization"] = `Bearer ${state.auth.access_token}`;
    }

    async run() {
        // Add access token to request
        try {
            this.addAccessTokenToRequest();
        } catch (e) {
            if (e instanceof TokenValidationError) return new FetchResult({ status: "Invalid token", error: "Invalid token.", errorType: FetchErrorType.auth });
            else throw e;
        }

        try {
            // Send request
            if (this.init.body && typeof(this.init.body) === "object") this.init.body = JSON.stringify(this.init.body);
            const response = await fetch(this.URL, this.init);
            const result = await FetchResult.fromResponse(response);

            // Handle response auth data
            switch (result.status) {
                case 200:
                    // Update token expiration time for successful fetches, which prolonged it
                    if (this.useAccessToken && result.json?.auth?.access_token_expiration_time) {
                        const { access_token_expiration_time } = result.json.auth;
                        getFromDocumentApp("store").dispatch(setAuthInformation({ access_token_expiration_time }));
                    }
                    break;

                case 401:
                    // Clear auth data, if token is invalid
                    if (this.useAccessToken) getFromDocumentApp("store").dispatch(setAuthInformation(getDefaultAuthState()));
                    break;
            }

            // Return fetch result
            return result;


        } catch (e) {
            // Handle network error
            if (e instanceof TypeError && e.message.indexOf("NetworkError") > -1)
                return new FetchResult({ status: "Network error", error: "Failed to fetch data.", errorType: FetchErrorType.general });
            else throw e;
        }
    }
}


/** Contains results of a fetch run by a `FetchRunner` instance. */
export class FetchResult {
    status: number | string
    headers: Headers | { get: (h: string) => string | null }
    text: string | undefined
    json: Record<string, any> | undefined
    error: string | undefined
    errorType: FetchErrorType

    constructor(args: FetchResultArgs) {
        // Validate args before assignment
        fetchResultArgs.parse(args);

        const { status, headers, text, json, error, errorType } = args;
        this.status = status;
        this.headers = headers || { get: h => null };
        this.text = text;
        this.json = json;
        this.error = error;
        this.errorType = errorType;
    }

    get failed() {
        return this.errorType > FetchErrorType.none;
    }

    /** Processes a `response` from fetch into a `FetchResult` instance. */
    static async fromResponse(response: Response) {
        const { status, headers } = response;

        // text & json
        let text = await response.text();
        let json = undefined;
        try { json = JSON.parse(text); } catch(e) {}

        // error
        let error = undefined;
        if (status === 401) error = "Invalid token.";
        else if (status === 500) error = text;
        else if (json !== undefined) error = json._error;

        // errorType
        const errorType = !error ? FetchErrorType.none : status === 401 ? FetchErrorType.auth : FetchErrorType.general;

        return new FetchResult({ status, headers, text, json, error, errorType });
    }

    /** Generates a FetchResult indicating that a fetch was not run. */
    static fetchNotRun(customArgs: Partial<FetchResultArgs> = {}) {
        const { error, errorType = FetchErrorType.none } = customArgs;
        
        const args = { status: "Not run", errorType } as FetchResultArgs;
        if (error !== undefined) args.error = error;

        return new FetchResult(args);
    }
}


/** Thrown if pre-fetch auth token validation fails. */
class TokenValidationError extends Error {};


/** Additional options for FetchRunner object. */
type FetchRunnerOptions = {
    /** Flag for validating & adding access token to request headers (default is true). */
    useAccessToken?: boolean,

    /** Flag for adding 'application/json' content-type header to request (default is true). */
    contentTypeJSON?: boolean,

    /** String added to the start of URL (default is `backendURL` from app config). */
    URLPrefix?: string
};


/** Type of an error that occured during a fetch run attempt. */
export enum FetchErrorType {
    none,
    general,
    auth
}

/** FetchResult constructor args schema. */
const fetchResultArgs = z.object({
    status: int.or(z.string()),
    // headers: z.instanceof(Headers).or(z.record(z.string())).optional(),
    headers: z.instanceof(Headers).or(z.object({
        // get: (h: string) => z.string().or(z.null())
        get: z.function()
            .args(z.string())
            .returns(z.string().or(z.null()))
    })
        
    ).optional(),
    text: z.string().optional(),
    json: z.record(z.any()).optional(),
    error: z.string().optional(),
    errorType: z.nativeEnum(FetchErrorType)
});


/** FetchResult constructor args type. */
type FetchResultArgs = z.infer<typeof fetchResultArgs>;
/** RequestInit type with `body` capable of being an object (JSON.stringify is applied to it in that case). */
type RequestInitWithObjectBody = Omit<RequestInit, "body"> & { body?: BodyInit | null | object };
