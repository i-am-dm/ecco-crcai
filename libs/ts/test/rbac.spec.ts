import { test, strict as assert } from "node:test";
import { enforceRBAC } from "../src/rbac.js";

test("Admin allows all", () => {
  assert.equal(enforceRBAC(["Admin"], "venture", "POST", "dev").allowed, true);
});

test("Investor read-only prod only", () => {
  assert.equal(enforceRBAC(["Investor"], "venture", "GET", "prod").allowed, true);
  assert.equal(enforceRBAC(["Investor"], "venture", "POST", "prod").allowed, false);
  assert.equal(enforceRBAC(["Investor"], "idea", "GET", "prod").allowed, false);
  assert.equal(enforceRBAC(["Investor"], "venture", "GET", "dev").allowed, false);
});

