/** The shape of a translated namespace: same keys as the Persian source, any string values. */
export type Strings<T> = { [K in keyof T]: T[K] extends string ? string : Strings<T[K]> };
