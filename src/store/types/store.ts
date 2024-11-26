import type { AnyAction, Store } from "redux";
import type { ThunkDispatch } from "redux-thunk";

import type { State } from "./state";


export type AppStore = Store<State, any>;

/** Extended version of dispatch type, which can propagate return types of dispatched thunks. */
export type Dispatch = ThunkDispatch<State, unknown, AnyAction>;

export type GetState = AppStore["getState"];

/** Mapping between Redux action types and handler */
export type ActionHandlers = Record<string, (state: State, action: any) => State>;
