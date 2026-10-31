// Exact password/session versions avoid JWT whole-second timestamp gaps (PS-3, PS-5).
export const passwordVersion = (user) => user.passwordChangedAt?.getTime() ?? 0;
export const nextPasswordChangedAt = (previous) =>
  new Date(Math.max(Date.now(), (previous?.getTime() ?? 0) + 1));

export const matchesPasswordVersion = (payload, user) =>
  (payload.passwordVersion ?? 0) === passwordVersion(user);
