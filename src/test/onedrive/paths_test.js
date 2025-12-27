"use strict";

const assert = require("assert");
const { PathKind, getOnedrivePath } = require("../../src/lib/onedrive/paths");

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function run() {
  let failures = 0;

  for (const { name, fn } of tests) {
    try {
      fn();
      console.log(`✓ ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`✗ ${name}`);
      console.error(error);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

test("builds template paths", () => {
  const result = getOnedrivePath({
    folderKey: "finance/2024",
    username: "ignored",
    pathKind: PathKind.TEMPLATE,
  });

  assert.strictEqual(result, "aplikasi progres/templates/finance/2024");
});

test("builds generated paths", () => {
  const result = getOnedrivePath({
    folderKey: "exports/report",
    username: "andi",
    pathKind: PathKind.GENERATED,
  });

  assert.strictEqual(
    result,
    "aplikasi progres/generated/andi/exports/report"
  );
});

test("handles nested folder keys", () => {
  const result = getOnedrivePath({
    folderKey: "nested/custom/v2",
    username: "budi",
    pathKind: PathKind.TEMPLATE,
  });

  assert.strictEqual(result, "aplikasi progres/templates/nested/custom/v2");
});

run();