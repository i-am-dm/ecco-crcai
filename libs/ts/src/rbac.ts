export type Role = "Admin" | "Leadership" | "Lead" | "Contributor" | "Investor" | "Advisor";

export function enforceRBAC(
  roles: Role[],
  entity?: string,
  method: string = "GET",
  env?: string
): { allowed: boolean; reason?: string } {
  const set = new Set(roles);
  if (["Admin", "Leadership", "Lead", "Contributor"].some((r) => set.has(r as Role))) return { allowed: true };
  if (set.has("Investor") || set.has("Advisor")) {
    if (method !== "GET") return { allowed: false, reason: "read_only" };
    if (env && env !== "prod") return { allowed: false, reason: "env_restricted" };
    if (entity && !["venture", "cap_table", "round"].includes(entity)) return { allowed: false, reason: "entity_restricted" };
    return { allowed: true };
  }
  return { allowed: false, reason: "unauthorized" };
}

