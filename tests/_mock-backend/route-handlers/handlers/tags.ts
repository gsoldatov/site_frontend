import { z } from "zod";

import { RouteHandler } from "../route-handler";

import { nonEmptyPositiveIntArray } from "../../../../src/util/types/common";
import type { MockBackend } from "../../mock-backend";


const tagsViewBodySchema = z.object({
    tag_ids: nonEmptyPositiveIntArray
});


export class TagsRouteHandlers {
    [index: string]: RouteHandler | MockBackend
    private backend: MockBackend
    view: RouteHandler

    constructor(backend: MockBackend) {
        this.backend = backend;

        this.view = new RouteHandler(backend, {
            route: "/tags/view", method: "POST",
            getResponse: requestContext => {
                const { tag_ids = [] } = tagsViewBodySchema.parse(requestContext.body);
                if (tag_ids.length === 0) return { status: 400, body: { _error: "Non-empty tag_ids required." }};

                const tags = tag_ids.map(tag_id => this.backend.data.tag(tag_id));
                return { status: 200, body: { tags }};
            }
        });
    }
}
