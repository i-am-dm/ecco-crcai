// JSON Schema validator with optional Ajv usage; falls back to a minimal validator
// supporting: type checks, required, enum, basic array items, object properties

type ValidateResult = { valid: true } | { valid: false; errors: string[] };

export async function validateJson(
  schema: any,
  data: any
): Promise<ValidateResult> {
  // Try Ajv if present
  try {
    const mod = await import("ajv").catch(() => null) as any;
    if (mod) {
      const Ajv = mod.default || mod;
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(schema);
      const ok = validate(data);
      if (ok) return { valid: true };
      const errs = (validate.errors || []).map((e: any) => `${e.instancePath || e.schemaPath}: ${e.message}`);
      return { valid: false, errors: errs };
    }
  } catch {
    // ignore, fallthrough to minimal validator
  }
  // Minimal validator
  const errors: string[] = [];

  function typeOf(x: any): string {
    if (Array.isArray(x)) return "array";
    if (x === null) return "null";
    return typeof x;
  }

  function checkType(expected: any, value: any, path: string) {
    if (!expected) return;
    if (typeof expected === "string") {
      if (expected === "number" && typeof value === "number" && !Number.isFinite(value)) {
        errors.push(`${path}: number must be finite`);
      } else if (typeOf(value) !== expected) {
        errors.push(`${path}: expected type ${expected}, got ${typeOf(value)}`);
      }
    } else if (Array.isArray(expected)) {
      if (!expected.includes(value)) {
        errors.push(`${path}: value not in enum`);
      }
    } else if (typeof expected === "object") {
      // ignore here; handled via properties/items
    }
  }

  function validateNode(s: any, v: any, path: string) {
    if (!s) return;
    if (s.enum) {
      if (!s.enum.includes(v)) errors.push(`${path}: value not in enum`);
    }
    if (s.type) {
      checkType(s.type, v, path);
    }
    if (s.type === "object" && s.properties && v && typeof v === "object" && !Array.isArray(v)) {
      const req: string[] = s.required || [];
      for (const r of req) {
        if (!(r in v)) errors.push(`${path}: missing required property ${r}`);
      }
      for (const [k, ps] of Object.entries<any>(s.properties)) {
        if (k in v) validateNode(ps, (v as any)[k], `${path}.${k}`);
      }
    }
    if (s.type === "array" && Array.isArray(v)) {
      if (s.items) {
        v.forEach((item, i) => validateNode(s.items, item, `${path}[${i}]`));
      }
    }
    if (typeof v === "number") {
      if (typeof s.minimum === "number" && v < s.minimum) errors.push(`${path}: less than minimum ${s.minimum}`);
      if (typeof s.maximum === "number" && v > s.maximum) errors.push(`${path}: greater than maximum ${s.maximum}`);
    }
  }

  // Top-level required
  const required: string[] = schema.required || [];
  for (const r of required) {
    if (!(r in data)) errors.push(`$.${r}: missing required property`);
  }
  // Properties
  if (schema.properties) {
    for (const [k, ps] of Object.entries<any>(schema.properties)) {
      if (k in data) validateNode(ps, (data as any)[k], `$.${k}`);
    }
  }
  // Type
  if (schema.type) {
    checkType(schema.type, data, "$");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

