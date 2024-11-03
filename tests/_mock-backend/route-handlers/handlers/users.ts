import { z } from "zod";

import { RouteHandler } from "../route-handler";

import { nonEmptyPositiveIntArray } from "../../../../src/util/types/common";
import type { MockBackend } from "../../mock-backend";


const usersViewBody = z.object({
    user_ids: nonEmptyPositiveIntArray,
    full_view_mode: z.boolean().optional()
});


export class UsersRouteHandlers {
    [index: string]: RouteHandler | MockBackend
    private backend: MockBackend
    view: RouteHandler

    constructor(backend: MockBackend) {
        this.backend = backend;

        this.view = new RouteHandler(backend, {
            route: "/users/view", method: "POST",
            getResponse: requestContext => {
                const { user_ids, full_view_mode } = usersViewBody.parse(requestContext.body);
                if (user_ids.length === 0) return { status: 400, body: { _error: "Non-empty user_ids required." }};

                const users = full_view_mode
                    ? user_ids.map(user_id => this.backend.data.user(user_id))
                    : user_ids.map(user_id => this.backend.data.userMin(user_id));
                return { status: 200, body: { users }};
            }
        });
    }
}
