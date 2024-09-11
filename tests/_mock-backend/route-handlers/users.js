import { RouteHandler } from "./route-handler";

export class UsersRouteHandlers {
    constructor(backend) {
        this.backend = backend;

        this.view = new RouteHandler(backend, {
            route: "/users/view", method: "POST",
            getResponse: requestContext => {
                const { user_ids, full_view_mode } = requestContext.body;
                if (user_ids.length === 0) return { status: 400, body: { _error: "Non-empty user_ids required." }};

                const users = user_ids.map(user_id => this.backend.data.user(user_id, full_view_mode));
                return { status: 200, body: { users }};
            }
        });
    }
}
