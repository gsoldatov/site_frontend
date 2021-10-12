import { getMockLoginResponse } from "./data-auth";


function handleRegister(body) {
    return { status: 200 };
}


function handleLogin(body) {
    return { status: 200, body: getMockLoginResponse() };
}


function handleLogout(body) {
    return { status: 200 };
}


export const authHandlersList = new Map([
    ["/auth/register", {"POST": handleRegister}],
    ["/auth/login", {"POST": handleLogin}],
    ["/auth/logout", {"POST": handleLogout}]
]);
