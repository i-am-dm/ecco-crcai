import type { EnvelopeBase } from "./envelope.js";

export function migrateSnapshotMinorAdditive<T extends EnvelopeBase>(snapshot: T): T {
  // Placeholder for minor additive migrations; currently pass-through.
  // In future, apply defaults for newly-added optional fields.
  return snapshot;
}

export function compactHighChurn<T extends EnvelopeBase>(snapshot: T): T {
  // Apply simple compactions for known entities
  if ((snapshot as any).entity === "cap_table") {
    const holders = (snapshot as any).holders;
    if (Array.isArray(holders)) {
      const byId = new Map<string, any>();
      for (const h of holders) {
        const key = String(h.holderId || "");
        if (!key) continue;
        const prev = byId.get(key);
        if (!prev) {
          byId.set(key, { ...h });
        } else {
          // merge quantities if duplicate
          prev.quantity = Number(prev.quantity || 0) + Number(h.quantity || 0);
          byId.set(key, prev);
        }
      }
      (snapshot as any).holders = Array.from(byId.values());
    }
  }
  return snapshot;
}

