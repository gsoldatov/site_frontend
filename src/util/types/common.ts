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
