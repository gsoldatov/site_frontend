import { getBackend } from "../../_mock-backend/mock-backend";

import type { RequestContext } from "../../_mock-backend/request-context";
import type { RouteHandler } from "../../_mock-backend/route-handlers/route-handler";
import { getErrorResponse } from "./fetch-failures";


export const mockAuthLoginUnauthorizedMessage = "Incorrect login or password.";


/**
 * Adds a mock fetch with a 401 response status for /auth/login route.
 */
export function mockAuthLoginUnauthorized(this: RouteHandler, objectIDs: number[]) {
    const backend = getBackend();

    backend.routeHandlers.auth.login.setCustomResponseFunction(function (this: RouteHandler, requestContext: RequestContext) {
        return getErrorResponse(401, mockAuthLoginUnauthorizedMessage);
    });
};


/**
 * Adds a mock fetch with a 429 response status for /auth/login route.
 */
export function mockAuthLoginTooManyRequests(this: RouteHandler, objectIDs: number[]) {
    const backend = getBackend();

    backend.routeHandlers.auth.login.setCustomResponseFunction(function (this: RouteHandler, requestContext: RequestContext) {
        return { status: 429, headers: {"Retry-After": 100}};
    });
};
