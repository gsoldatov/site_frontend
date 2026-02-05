import { z } from "zod";

import { RouteHandler } from "../route-handler";

import type { MockBackend } from "../../mock-backend";


const authLoginBody = z.object({
    login: z.string().min(1).max(255),
    password: z.string().min(8).max(72)
});


export class AuthRouteHandlers {
    [index: string]: RouteHandler | MockBackend
    private backend: MockBackend
    login: RouteHandler

    constructor(backend: MockBackend) {
        this.backend = backend;

        this.login = new RouteHandler(backend, {
            route: "/auth/login", method: "POST",
            getResponse: requestContext => {
                authLoginBody.parse(requestContext.body);
                return { status: 200, body: this.backend.data.generator.auth.login() };
            }
        });
    }
}
