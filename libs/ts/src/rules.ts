import { nowRfc3339 } from "./rfc3339.js";
import { ulid } from "./ulid.js";
import { makeSnapshotPath } from "./writepath.js";
import type { EnvelopeBase, Env } from "./envelope.js";

export type RuleOperator =
  | "eq"
  | "neq"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "includes"
  | "not_includes"
  | "exists"
  | "missing";

export interface RuleCondition {
  path: string;
  op: RuleOperator;
  value?: unknown;
}

export interface RuleDefinition extends EnvelopeBase {
  entity: "rule";
  match: {
    entity: EnvelopeBase["entity"];
    conditions: RuleCondition[];
  };
  action: {
    type: "alert";
    channel?: "log" | "webhook" | "storage";
    target?: string;
    severity?: "info" | "warn" | "critical";
  };
  description?: string;
}

export interface RuleEvaluationResult {
  rule: RuleDefinition;
  passed: boolean;
  matchedConditions: RuleCondition[];
  failedConditions: RuleCondition[];
}

export interface AlertRecord {
  id: string;
  rule_id: string;
  entity_id: string;
  entity: EnvelopeBase["entity"];
  env: Env;
  evaluated_at: string;
  snapshot_ptr: string;
  severity: "info" | "warn" | "critical";
  details: {
    rule_description?: string;
    matched_conditions: RuleCondition[];
    failed_conditions: RuleCondition[];
  };
}

export function evaluateRule(rule: RuleDefinition, snapshot: any): RuleEvaluationResult {
  const matched: RuleCondition[] = [];
  const failed: RuleCondition[] = [];

  if (!snapshot || typeof snapshot !== "object") {
    return { rule, passed: false, matchedConditions: [], failedConditions: rule.match.conditions };
  }

  if (snapshot.entity !== rule.match.entity) {
    return { rule, passed: false, matchedConditions: [], failedConditions: rule.match.conditions };
  }

  for (const condition of rule.match.conditions) {
    if (evaluateCondition(condition, snapshot)) {
      matched.push(condition);
    } else {
      failed.push(condition);
    }
  }

  return { rule, passed: failed.length === 0, matchedConditions: matched, failedConditions: failed };
}

export function buildAlert(rule: RuleDefinition, snapshot: EnvelopeBase, result: RuleEvaluationResult): AlertRecord {
  const severity = rule.action.severity ?? "info";
  return {
    id: ulid(),
    rule_id: rule.id,
    entity_id: snapshot.id,
    entity: snapshot.entity,
    env: snapshot.env,
    evaluated_at: nowRfc3339(),
    snapshot_ptr: makeSnapshotPath(snapshot.env, snapshot.entity, snapshot.id),
    severity,
    details: {
      rule_description: rule.description,
      matched_conditions: result.matchedConditions,
      failed_conditions: result.failedConditions,
    },
  };
}

function evaluateCondition(condition: RuleCondition, snapshot: any): boolean {
  const value = getValue(snapshot, condition.path);
  switch (condition.op) {
    case "eq":
      return value === condition.value;
    case "neq":
      return value !== condition.value;
    case "lt":
      return typeof value === "number" && typeof condition.value === "number" && value < condition.value;
    case "lte":
      return typeof value === "number" && typeof condition.value === "number" && value <= condition.value;
    case "gt":
      return typeof value === "number" && typeof condition.value === "number" && value > condition.value;
    case "gte":
      return typeof value === "number" && typeof condition.value === "number" && value >= condition.value;
    case "includes":
      return includesValue(value, condition.value);
    case "not_includes":
      return !includesValue(value, condition.value);
    case "exists":
      return value !== undefined && value !== null;
    case "missing":
      return value === undefined || value === null;
    default:
      return false;
  }
}

function includesValue(value: unknown, expected: unknown): boolean {
  if (Array.isArray(value)) {
    return value.includes(expected as never);
  }
  if (typeof value === "string" && typeof expected === "string") {
    return value.includes(expected);
  }
  return false;
}

function getValue(obj: any, path: string): any {
  if (!path) return undefined;
  return path.split(".").reduce((acc: any, key: string) => {
    if (acc === undefined || acc === null) return undefined;
    if (typeof acc !== "object") return undefined;
    return (acc as any)[key];
  }, obj);
}

