"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const WORKFLOW_PATH = path.join(
  __dirname,
  "..",
  ".github",
  "workflows",
  "snake.yml"
);

function loadWorkflow() {
  const raw = fs.readFileSync(WORKFLOW_PATH, "utf8");
  return { raw, doc: yaml.load(raw) };
}

test("snake.yml exists and is valid YAML", () => {
  assert.ok(fs.existsSync(WORKFLOW_PATH), "workflow file should exist");
  const { doc } = loadWorkflow();
  assert.equal(typeof doc, "object");
  assert.notEqual(doc, null);
});

test("workflow has the expected name", () => {
  const { doc } = loadWorkflow();
  assert.equal(doc.name, "generate snake animation");
});

test("workflow triggers include schedule, workflow_dispatch and push to main", () => {
  const { doc } = loadWorkflow();
  // js-yaml parses the "on" key as boolean `true` unless quoted, but GitHub
  // Actions YAML always uses the literal key "on" - guard against either form.
  const on = doc.on ?? doc[true];
  assert.ok(on, "workflow must define triggers under \"on\"");

  assert.ok(Array.isArray(on.schedule), "schedule should be a list");
  assert.equal(on.schedule.length, 1);
  assert.equal(on.schedule[0].cron, "0 */12 * * *");

  assert.ok(
    Object.prototype.hasOwnProperty.call(on, "workflow_dispatch"),
    "workflow_dispatch trigger should be present for manual runs"
  );

  assert.ok(on.push, "push trigger should be defined");
  assert.deepEqual(on.push.branches, ["main"]);
});

test("generate job runs on ubuntu-latest with contents:write permission", () => {
  const { doc } = loadWorkflow();
  const job = doc.jobs.generate;
  assert.ok(job, "jobs.generate must exist");
  assert.equal(job["runs-on"], "ubuntu-latest");
  assert.deepEqual(job.permissions, { contents: "write" });
});

test("generate job has exactly two steps in the expected order", () => {
  const { doc } = loadWorkflow();
  const steps = doc.jobs.generate.steps;
  assert.ok(Array.isArray(steps));
  assert.equal(steps.length, 2);
  assert.equal(steps[0].name, "Generate the snake SVGs");
  assert.equal(steps[1].name, 'Push the SVGs to the "output" branch');
});

test("snake generation step uses Platane/snk@v3 with the repository owner", () => {
  const { doc } = loadWorkflow();
  const step = doc.jobs.generate.steps[0];
  assert.equal(step.uses, "Platane/snk@v3");
  assert.equal(step.id, "snake-gif");
  assert.equal(
    step.with.github_user_name,
    "${{ github.repository_owner }}"
  );
});

test("snake generation step outputs both light and dark SVGs into dist/", () => {
  const { doc } = loadWorkflow();
  const outputs = doc.jobs.generate.steps[0].with.outputs;
  assert.equal(typeof outputs, "string");

  const lines = outputs
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  assert.deepEqual(lines, [
    "dist/github-contribution-grid-snake.svg",
    "dist/github-contribution-grid-snake-dark.svg?palette=github-dark",
  ]);
});

test("publish step pushes dist/ to the output branch using the built-in token", () => {
  const { doc } = loadWorkflow();
  const step = doc.jobs.generate.steps[1];
  assert.equal(step.uses, "crazy-max/ghaction-github-pages@v4");
  assert.equal(step.with.target_branch, "output");
  assert.equal(step.with.build_dir, "dist");
  assert.equal(step.env.GITHUB_TOKEN, "${{ secrets.GITHUB_TOKEN }}");
});

test("workflow does not request more permissions than necessary", () => {
  const { doc } = loadWorkflow();
  const permissions = doc.jobs.generate.permissions;
  assert.deepEqual(Object.keys(permissions), ["contents"]);
});

test("cron schedule matches a valid 5-field cron expression", () => {
  const { doc } = loadWorkflow();
  const cron = doc.on.schedule[0].cron;
  const fields = cron.split(" ");
  assert.equal(fields.length, 5, "cron expressions must have 5 fields");
});