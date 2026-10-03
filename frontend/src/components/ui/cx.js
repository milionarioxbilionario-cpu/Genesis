// Junta classes ignorando valores falsos.
export const cx = (...parts) => parts.filter(Boolean).join(' ');
