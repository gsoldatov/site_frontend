import type { State } from "../../store/types/state";


/** Mapping between Redux action types and handler */
export type ActionHandlers = Record<string, (state: State, action: any) => State>;
