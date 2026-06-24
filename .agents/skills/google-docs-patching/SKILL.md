---
name: google-docs-patching
description: Guides AI agents on how to safely read, edit, and patch Google Docs tab contents using the tokenized linear text system and Operational Transformation (OT) or Right-to-Left index translation.
---

# Google Docs Patching Skill

Use this skill when you need to read or update Google Docs contents via the `google-docs-bridge` MCP server (runs on `localhost:3000`). The system uses a **lossless, tokenized linear text pipeline** that preserves formatting, styling, images, and tables.

---

## Core Concepts

### 1. Tokenized Linear Text (`{{tag:value}}` format)

When reading document contents using `getcontents`, the server returns a **newline-separated linear text stream** where each line represents one paragraph (or one structural element). Formatting is encoded using `{{tag:value}}` prefix tokens:

```
{{align:left}}{{heading:0}}{{list:bulleted}}{{color:#000000}}{{fontSize:11}}Hello world{{color:default}}{{fontSize:default}}
```

Common tags:
| Tag | Meaning |
|-----|---------|
| `{{align:left\|center\|right}}` | Paragraph alignment |
| `{{heading:0\|1\|2\|3}}` | Heading level (0 = normal body text) |
| `{{list:bulleted\|ordered}}` | List type |
| `{{bold:true\|false}}` | Bold text |
| `{{italic:true\|false}}` | Italic text |
| `{{color:#RRGGBB\|default}}` | Text foreground colour |
| `{{fontSize:N\|default}}` | Font size in pt |

**Tables** are represented on a **single line** as a JSON blob:
```
{{table:{"rows":3,"cols":2,"backgroundColors":[[...],[...]],"cells":[[...],[...]]}}}
```

Each cell value is itself a styled string (tags + text + closing tags + `\n`).

**Images** are represented as:
```
{{image:objectId src="https://..."}}
```

> [!IMPORTANT]
> Do **not** manually edit the JSON inside `{{table:...}}` unless you are building a replacement token deliberately. Partial edits to a table token will break the JSON and cause the operation to fail.

### 2. Style Tags are Prefix-Based

Tags come at the **beginning** of the line and apply until the closing tag (e.g. `{{color:default}}`). When inserting new text, include the full set of style tags as a prefix:

```
{{align:left}}{{heading:0}}{{color:#1155CC}}{{fontSize:11}}Your answer here{{color:default}}{{fontSize:default}}
```

### 3. Character Offsets and OT Operations

`apply_structural_edits` works with **character offsets in the linear text** (all lines joined with `\n`). Build operations by computing line offsets:

```js
// Compute start offset of each line
const offsets = [];
let o = 0;
for (const l of lines) { offsets.push(o); o += l.length + 1; }
```

Ops: `{ type: 'retain', count: N }`, `{ type: 'delete', count: N }`, `{ type: 'insert', text: '...' }`.

---

## MCP Tools Reference

### `getcontents`
Read document content. Returns tokenized linear text + element map.
- `id` (required): Google Doc file ID
- `tabId` (optional, e.g. `"t.0"`): Tab ID (defaults to document body)
- `startLine` / `endLine` (optional): For chunked reads (1-based)

### `apply_structural_edits` ⭐ Recommended for text edits
Apply OT operations to the linear text stream.
- `id`, `tabId`, `operations` (array of retain/insert/delete objects)

> [!WARNING]
> **Table replacement via this tool is broken for isolated table-only edits.**
> When the OT op only replaces a `{{table:...}}` token (no surrounding text changes), the Phase 1 placeholder is empty so Phase 2/3 silently fail to populate cell text. Use `fill_table_cells` instead.

### `fill_table_cells` ⭐ Use this to fill existing table cells
Directly inserts text into specific cells of an **already-existing** table using a raw `batchUpdate`, bypassing the broken Phase 3 logic.
- `id` (required): Google Doc file ID
- `tabId` (optional): Tab ID
- `tableIndex` (required): 0-based index of the table within the tab (e.g. `1` = second table)
- `cells` (required): Array of `{ row, col, text, colorHex? }` objects

Example:
```json
{
  "id": "1ABC...",
  "tabId": "t.0",
  "tableIndex": 1,
  "cells": [
    { "row": 1, "col": 1, "text": "The Sun is huge.", "colorHex": "#1155CC" },
    { "row": 2, "col": 1, "text": "Mercury is tiny.", "colorHex": "#1155CC" }
  ]
}
```

### `applypatch`
Apply a unified diff or DMP patch string.
- `id`, `tabId`, `patch`, `algorithm` (`"unified"` default or `"dmp"`)

### `makecopy`
Copy a Google Doc.
- `id` (required): Source doc ID
- `title` (optional): Title for the copy
- Returns: `{ id, title, url, lastEditedMs, lastEditedIso }`

### `listfiles`, `searchfiles`
List or search accessible Google Docs.

---

## Patterns & Best Practices

### Pattern 1: Read → Find Lines → Build OT Ops → Apply

```js
const read = await callMcp('tools/call', { name: 'getcontents', arguments: { id, tabId: 't.0' } });
const text = read.result.structuredContent.text;
const lines = text.split('\n');
const offsets = [];
let o = 0;
for (const l of lines) { offsets.push(o); o += l.length + 1; }

// Find the target line
const lineIdx = lines.findIndex(l => l.replace(/\{\{[^}]+\}\}/g,'').trim().includes('search text'));

// Build ops
const ops = [
  { type: 'retain', count: offsets[lineIdx] },
  { type: 'delete', count: lines[lineIdx].length },
  { type: 'insert', text: '{{align:left}}{{heading:0}}{{color:#1155CC}}{{fontSize:11}}New answer{{color:default}}{{fontSize:default}}' },
  { type: 'retain', count: text.length - offsets[lineIdx] - lines[lineIdx].length },
];

await callMcp('tools/call', { name: 'apply_structural_edits', arguments: { id, tabId: 't.0', operations: ops } });
```

### Pattern 2: Multi-edit — Sort by line, compute offsets carefully

When editing multiple lines in one call, **sort edits ascending by line index**, then compute the offset for each edit from the original `offsets[]` array. The OT ops must cover all characters from start to end of the document with a combination of `retain`, `delete`, and `insert` ops.

### Pattern 3: Fill table cells (two-pass workflow)

```
Pass 1: apply_structural_edits  → fill blank answer lines (skip table lines)
Pass 2: fill_table_cells         → fill existing table cells directly
```

After Pass 1, re-read the doc to get fresh line indices before Pass 2.

### Pattern 4: Searching for text with special characters

Google Docs often stores curly apostrophes (`'` U+2019) and curly quotes (`"` U+201C/`"` U+201D) instead of ASCII `'` and `"`. When searching for a line:

```js
// Use a fragment without special characters
const lineIdx = findLine(lines, 'shape is Earth');        // instead of "Earth's orbit"
const lineIdx = findLine(lines, 'lunar eclipses every time');  // instead of "don't"
const lineIdx = findLine(lines, 'eclipse" mean') !== -1   // check both straight and curly
  ? findLine(lines, 'eclipse" mean')
  : findLine(lines, 'eclipse\u201d mean');
```

### Pattern 5: Safe copy-then-edit workflow

Always work on a **copy** of the source document to avoid irreversibly changing the original:

```js
const copy = await callMcp('tools/call', { name: 'makecopy', arguments: { id: SOURCE_ID, title: 'Working Copy' } });
const copyId = copy.result.structuredContent.id;
```

---

## Known Bugs & Workarounds

### Bug: Table cell text not populated when replacing a `{{table:...}}` token

**Symptom**: `apply_structural_edits` with a replace of just a table token completes without error, but the table cells remain empty in Google Docs.

**Root cause**: When the OT insert operation contains only a `{{table:...}}` token (no surrounding text), `translateOpsToDocOps` produces `cleanLines = ['']` → `plainTextToInsert = ''` → no `insert_text` op is created for the Phase 1 placeholder. Phase 2 then deletes the wrong character, and Phase 3 fails to find the newly created table.

**Workaround**: Use `fill_table_cells` to populate cells in an already-existing table. The table structure from `makecopy` is preserved as-is; only fill in the blank cells.

### Bug: Phase 3 table matching fails for multiple simultaneous table insertions

When inserting multiple new tables in a single `apply_structural_edits` call, the `cumulativeTableLengthShift` in Phase 3 may not account for position shifts from earlier insertions, causing cell content to be inserted into the wrong table.

**Workaround**: Insert one table at a time, re-reading the doc between each call.

---

## Inserting Styled Text — Template

```
{{align:left}}{{heading:0}}{{color:#1155CC}}{{fontSize:11}}Answer text here.{{color:default}}{{fontSize:default}}
```

For ordered list items (e.g. numbered question answers):
```
{{align:left}}{{heading:0}}{{list:ordered}}{{color:#000000}}{{fontSize:11}}Question text? {{color:#1155CC}}Answer here.{{color:default}}{{fontSize:default}}
```

---

## Quick Reference: Line offset helper

```js
function stripTags(line) { return line.replace(/\{\{[^}]+\}\}/g, '').trim(); }

function findLine(lines, searchText, from = 0) {
  const sl = searchText.toLowerCase();
  for (let i = from; i < lines.length; i++) {
    if (stripTags(lines[i]).toLowerCase().includes(sl)) return i;
  }
  return -1;
}

function firstBlankAfter(lines, fromIdx, maxLook = 12) {
  for (let i = fromIdx + 1; i <= Math.min(fromIdx + maxLook, lines.length - 1); i++) {
    if (stripTags(lines[i]) === '') return i;
  }
  return -1;
}

function computeOffsets(lines) {
  const offsets = [];
  let o = 0;
  for (const l of lines) { offsets.push(o); o += l.length + 1; }
  return offsets;
}
```
