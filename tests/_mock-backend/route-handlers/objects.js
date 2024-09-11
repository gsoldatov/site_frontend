import { RouteHandler } from "./route-handler";


export class ObjectsRouteHandlers {
    constructor(backend) {
        this.backend = backend;

        this.view = new RouteHandler(backend, {
            route: "/objects/view", method: "POST",
            getResponse: requestContext => {
                const { object_ids = [], object_data_ids = [] } = requestContext.body;
                if (object_ids.length === 0 && object_data_ids.length === 0)
                    return { status: 400, body: { _error: "Non-empty object_ids or object_data_ids required." }};

                const objects = object_ids.map(object_id => this.backend.data.object(object_id).attributes);
                const object_data = object_data_ids.map(object_id => {
                    const object = this.backend.data.object(object_id);
                    return {
                        object_id,
                        object_type: object.attributes.object_type,
                        object_data: object.data
                    }
                });

                return {status: 200, body: { objects, object_data }};
            }
        });
    }
}
