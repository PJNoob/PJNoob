"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const README_PATH = path.join(__dirname, "..", "README.md");
const README = fs.readFileSync(README_PATH, "utf8");

function countOccurrences(text, pattern) {
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

test("README.md exists and is non-empty", () => {
  assert.ok(fs.existsSync(README_PATH));
  assert.ok(README.trim().length > 0);
});

test("header uses the capsule-render waving banner with the greeting text", () => {
  assert.match(
    README,
    /capsule-render\.vercel\.app\/api\?type=waving[^"]*text=Hey,%20I'm%20PJNoob/
  );
});

test("typing animation badge uses the demolab.com service (not the retired heroku one)", () => {
  assert.match(README, /readme-typing-svg\.demolab\.com/);
  assert.doesNotMatch(README, /readme-typing-svg\.herokuapp\.com/);
});

test("profile view and follower badges reference the PJNoob username", () => {
  assert.match(README, /komarev\.com\/ghpvc\/\?username=PJNoob/);
  assert.match(README, /img\.shields\.io\/github\/followers\/PJNoob/);
});

test("all expected top-level sections are present in order", () => {
  const expectedHeadings = [
    "## ✨ Who is PJNoob?",
    "### 🌈 Breaking Down the Name",
    "## 🎯 What Gets Me Excited",
    "## 🛠️ My Playground",
    "## 📊 Live From GitHub",
    "## 🚀 Projects I'm Proud Of",
    "## 🎪 Random Fun Facts About Me",
    "## 💡 Currently Exploring",
    "## 🎭 My Philosophy",
    "## 🌟 Let's Connect!",
  ];

  let searchFrom = 0;
  for (const heading of expectedHeadings) {
    const index = README.indexOf(heading, searchFrom);
    assert.notEqual(index, -1, `missing heading: ${heading}`);
    searchFrom = index + heading.length;
  }
});

test("HTML/CSS badge URL-encodes the slash", () => {
  assert.match(README, /HTML%2FCSS/);
  assert.doesNotMatch(README, /badge\/HTML\/CSS-/);
});

test("'Breaking Down the Name' renders as a centered three-column badge table", () => {
  const section = README.slice(
    README.indexOf("### 🌈 Breaking Down the Name"),
    README.indexOf("## 🎯 What Gets Me Excited")
  );
  assert.match(section, /\|:---:\|:---:\|:---:\|/);
  assert.match(section, /Pixel_by_Pixel/);
  assert.match(section, /Just_Keep_Going/);
  assert.match(section, /Forever_a_Student/);
  assert.doesNotMatch(section, /╔═+╗/, "old ASCII-art box should be removed");
});

test("Live From GitHub section wires up stats, streak, top languages and activity graph for PJNoob", () => {
  const section = README.slice(
    README.indexOf("## 📊 Live From GitHub"),
    README.indexOf("## 🚀 Projects I'm Proud Of")
  );
  assert.match(section, /github-readme-stats\.vercel\.app\/api\?username=PJNoob/);
  assert.match(section, /streak-stats\.demolab\.com\?user=PJNoob/);
  assert.match(section, /github-readme-stats\.vercel\.app\/api\/top-langs\/\?username=PJNoob/);
  assert.match(section, /github-readme-activity-graph\.vercel\.app\/graph\?username=PJNoob/);
  assert.match(section, /github-profile-trophy\.vercel\.app\/\?username=PJNoob/);
});

test("snake animation <picture> points at the output branch SVGs for both color schemes", () => {
  const section = README.slice(
    README.indexOf("<picture>"),
    README.indexOf("</picture>") + "</picture>".length
  );
  assert.match(
    section,
    /prefers-color-scheme: dark[\s\S]*raw\.githubusercontent\.com\/PJNoob\/PJNoob\/output\/github-contribution-grid-snake-dark\.svg/
  );
  assert.match(
    section,
    /prefers-color-scheme: light[\s\S]*raw\.githubusercontent\.com\/PJNoob\/PJNoob\/output\/github-contribution-grid-snake\.svg/
  );
  assert.match(
    section,
    /<img alt="A snake eating my contribution graph" src="https:\/\/raw\.githubusercontent\.com\/PJNoob\/PJNoob\/output\/github-contribution-grid-snake\.svg"/
  );
});

test("snake caption references the workflow file that generates it", () => {
  assert.match(README, /Set up automatically by <code>\.github\/workflows\/snake\.yml<\/code>/);
});

test("all four pinned project cards reference the correct PJNoob repos", () => {
  const repos = [
    "ai-engineering-from-scratch",
    "30-Days-Of-Python",
    "MediLink-Pro-My-Version-",
    "system-design-primer",
  ];
  for (const repo of repos) {
    const linkPattern = new RegExp(
      `href="https://github\\.com/PJNoob/${repo.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}"`
    );
    const pinPattern = new RegExp(
      `github-readme-stats\\.vercel\\.app/api/pin/\\?username=PJNoob&repo=${repo.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}`
    );
    assert.match(README, linkPattern, `missing link for ${repo}`);
    assert.match(README, pinPattern, `missing pin card for ${repo}`);
  }
});

test("Random Fun Facts section is collapsed behind a <details> disclosure", () => {
  const section = README.slice(
    README.indexOf("## 🎪 Random Fun Facts About Me"),
    README.indexOf("## 💡 Currently Exploring")
  );
  assert.match(section, /<details>/);
  assert.match(section, /<summary><b>🧠 Click to reveal/);
  assert.match(section, /<\/details>/);
  assert.doesNotMatch(section, /┌─+┐/, "old ASCII-art box should be removed");
});

test("Wisdom Corner quotes are collapsed behind a <details> disclosure", () => {
  const section = README.slice(
    README.lastIndexOf("<details>", README.indexOf("🎮 Wisdom Corner"))
  );
  assert.match(section, /<details>/);
  assert.match(section, /B\.B\. King/);
  assert.match(section, /Elon Musk/);
  assert.match(section, /Eleanor Roosevelt/);
  assert.match(section, /<\/details>/);
});

test("Let's Connect section warns that bracketed placeholders must be replaced", () => {
  const section = README.slice(README.indexOf("## 🌟 Let's Connect!"));
  const placeholders = [
    "[your-linkedin]",
    "[your-email]",
    "[your-instagram]",
    "[your-handle]",
  ];
  for (const placeholder of placeholders) {
    assert.ok(
      section.includes(placeholder),
      `expected placeholder ${placeholder} to be present`
    );
  }
  assert.match(section, /Placeholders above.*swap the.*\[bracketed\].*parts/s);
});

test("trailing setup-notes HTML comment documents the snake workflow one-time setup", () => {
  const commentMatch = README.match(/<!--([\s\S]*?)-->\s*$/);
  assert.ok(commentMatch, "README should end with a setup-notes comment");
  const comment = commentMatch[1];
  assert.match(comment, /\.github\/workflows\/snake\.yml/);
  assert.match(comment, /output.*branch/i);
  assert.match(comment, /\[bracketed\] placeholder/);
});

test("all <div>, <details> and <picture> tags are balanced", () => {
  // Strip HTML comments first: the trailing setup-notes comment mentions the
  // "<picture>" tag by name in prose, which would otherwise skew the count.
  const body = README.replace(/<!--[\s\S]*?-->/g, "");

  const openDivs = countOccurrences(body, /<div\b[^>]*>/g);
  const closeDivs = countOccurrences(body, /<\/div>/g);
  assert.equal(openDivs, closeDivs, "unbalanced <div> tags");

  const openDetails = countOccurrences(body, /<details>/g);
  const closeDetails = countOccurrences(body, /<\/details>/g);
  assert.equal(openDetails, closeDetails, "unbalanced <details> tags");

  const openPicture = countOccurrences(body, /<picture>/g);
  const closePicture = countOccurrences(body, /<\/picture>/g);
  assert.equal(openPicture, closePicture, "unbalanced <picture> tags");
});

test("does not contain unresolved merge conflict markers", () => {
  assert.doesNotMatch(README, /^<{7} /m);
  assert.doesNotMatch(README, /^={7}$/m);
  assert.doesNotMatch(README, /^>{7} /m);
});