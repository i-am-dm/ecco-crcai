import { nowRfc3339 } from "./rfc3339.js";

export type Env = "dev" | "stg" | "prod";

export interface EnvelopeBase {
  id: string;
  entity:
    | "idea"
    | "venture"
    | "resource"
    | "budget"
    | "kpi"
    | "investor"
    | "partner"
    | "service"
    | "talent"
    | "experiment"
    | "round"
    | "cap_table"
    | "playbook"
    | "playbook_run"
    | "comment"
    | "show_page"
    | "rule"
    | "benchmark"
    | "report"
    | "model"
    | "simulation"
    | "dataroom";
  env: Env;
  schema_version: string;
  created_at: string; // RFC3339
  updated_at: string; // RFC3339
}

export function newEnvelope(
  id: string,
  entity: EnvelopeBase["entity"],
  env: Env,
  schemaVersion: string
): EnvelopeBase {
  const ts = nowRfc3339();
  return {
    id,
    entity,
    env,
    schema_version: schemaVersion,
    created_at: ts,
    updated_at: ts,
  };
}

export function touch<T extends EnvelopeBase>(obj: T): T {
  return { ...obj, updated_at: nowRfc3339() };
}
