/** Creates a unique id for a new record. Ids are always strings (the server requires it). */
export const uid = () => crypto.randomUUID()
