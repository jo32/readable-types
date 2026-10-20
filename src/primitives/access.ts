/** The property names of T. Like keyof, a union yields only the keys its members share. */
export type Keys<T> = keyof T;

/** Property names from every member of a union; Keys<T> keeps only the shared ones. */
export type AllKeys<T> = T extends unknown ? keyof T : never;

/** The union of property values. Optional properties contribute undefined. */
export type Values<T> = T[Keys<T>];

/** Read a known property; an unknown key is a compile-time error. */
export type Get<T, Key extends Keys<T>> = T[Key];

/** The element type of an array or tuple; excludes array methods and metadata. */
export type ElementOf<T extends readonly unknown[]> = T[number];
