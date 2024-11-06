import { z } from "zod";

import type { AnyAction, Store } from "redux";
import type { State } from "../../store/types/state";
import type { ThunkDispatch } from "redux-thunk";


// Integers
export const int = z.number().int();
export const positiveInt = int.min(1);
export const nonNegativeInt = int.min(0);

// Integer index types (can be an integer or an integer-containing string)
const stringInt = z.coerce.number().int();
export const intIndex = int.or(stringInt);
export const positiveIntIndex = positiveInt.or(stringInt.min(1));
export const nonNegativeIntIndex = nonNegativeInt.or(stringInt.min(0));

// Integer arrays
export const intArray = int.array();
export const positiveIntArray = positiveInt.array();
export const nonNegativeIntArray = nonNegativeInt.array();

export const nonEmptyIntArray = intArray.min(1);
export const nonEmptyPositiveIntArray = positiveIntArray.min(1);
export const nonEmptyNonNegativeIntArray = nonNegativeIntArray.min(1);

/** ISO timestamp string with timezone */
export const timestampString = z.string().datetime({ offset: true });
/** ISO timestamp string with timezone or an empty string */
export const timestampOrEmptyString = timestampString.or(z.string().max(0));

/** String with a width between 1 and 255 chars */
export const nameString = z.string().min(1).max(255);


/** Makes type from `T` with attributes specified in `K` optional. */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/** Makes type from `T` with attributes not specified in `K` optional. */
export type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

/** Returns a type based on `T` with its props recursively marked as optional. */
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]; };

// export type PositiveInteger<T extends number> = `${T}` extends "0" | `-${any}` | `${any}.${any}` ? never : T;   // does not work
// export type NonnegativeInteger<T extends number> = `${T}` extends `-${any}` | `${any}.${any}` ? never : T;


// TODO move into create-store when its made
export type AppStore = Store<State, any>;
// export type Dispatch = AppStore["dispatch"];
/** Extended version of dispatch type, which can propagate return types of dispatched thunks. */
export type Dispatch = ThunkDispatch<State, unknown, AnyAction>;
export type GetState = AppStore["getState"];
