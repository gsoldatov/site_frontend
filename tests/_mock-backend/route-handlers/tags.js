import { RouteHandler } from "./route-handler";


export class TagsRouteHandlers {
    constructor(backend) {
        this.backend = backend;

        this.view = new RouteHandler(backend, {
            route: "/tags/view", method: "POST",
            getResponse: requestContext => {
                const { tag_ids = [] } = requestContext.body;
                if (tag_ids.length === 0) return { status: 400, body: { _error: "Non-empty tag_ids required." }};

                const tags = tag_ids.map(tag_id => this.backend.data.tag(tag_id));
                return { status: 200, body: { tags }};
            }
        });
    }
}
