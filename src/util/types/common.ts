import { z } from "zod";


export const int = z.number().int();
export const positiveInt = int.min(1);
export const nonNegativeInt = int.min(0);

export const intArray = int.array();
export const positiveIntArray = positiveInt.array();
export const nonNegativeIntArray = nonNegativeInt.array();

export const nonEmptyIntArray = intArray.min(1);
export const nonEmptyPositiveIntArray = positiveIntArray.min(1);
export const nonEmptyNonNegativeIntArray = nonNegativeIntArray.min(1);


/**
 * Makes type from `T` with attributes specified in `K` optional.
 */
export type PickPartial<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes type from `T` with attributes not specified in `K` optional.
 */
export type PartialExcept<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

// export type PositiveInteger<T extends number> = `${T}` extends "0" | `-${any}` | `${any}.${any}` ? never : T;   // does not work
// export type NonnegativeInteger<T extends number> = `${T}` extends `-${any}` | `${any}.${any}` ? never : T;
