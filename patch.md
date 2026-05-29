# DocsPatcher Test Patches

Each patch below can be applied to `test.md` via the `applypatch` tool
(algorithm: `unified`). Patches are independent — apply them one at a time or
reset the document between runs.

---

## Patch 1 — Replace plain text paragraph

Replaces the plain "Plain text line." sentence with a styled version.

```patch
@@ -12,1 +12,1 @@
-Plain text line.
+{color:#333333}Plain text line (updated).{/color}
```

---

## Patch 2 — Add new inline-style lines after mixed styles block

Inserts additional mixed-style examples after the existing mixed styles section.

```patch
@@ -24,1 +24,4 @@
 {u}{color:#008800}{size:14}Underline + color + size{/size}{/color}{/u}
+
+{highlight:#e1f5fe}Highlighted plain text.{/highlight}
+{color:#880000}{highlight:#fff9c4}Color with highlight combo.{/highlight}{/color}
+{size:20}{highlight:#f3e5f5}Large highlighted text.{/highlight}{/size}
```

---

## Patch 3 — Update heading level 2

Changes the "## Inline Styles" heading to "## Inline Formatting".

```patch
@@ -10,1 +10,1 @@
-## Inline Styles
+## Inline Formatting
```

---

## Patch 4 — Add a row to the basic table

Adds a new row with highlight and mixed styles to the existing basic table.

```patch
@@ -74,1 +74,2 @@
 | Escaped \| pipe | Text with \\ backslash | Final cell |
+| {highlight:#ffff00}Highlighted{/highlight} | {cellbg:#e8f5e9}**Bold in green cell**{/color} | {u}Underline{/u} |
```

---

## Patch 5 — Replace the gold/blue/green merged header label

Updates the text in the merged header cell of the colspan table.

```patch
@@ -94,1 +94,1 @@
-| Header spans two cols | | Third col |
+| {cellbg:#ffe0b2}Header spans two cols (updated) | | Third col |
```

---

## Patch 6 — Add a new section before "End of test file"

Inserts a new "Summary" section with a table and bullets at the end.

```patch
@@ -133,1 +133,17 @@
+## Summary
+
+This document covers the following features:
+
+* **Headings** — levels 1–4
+* **Inline styles** — bold, italic, underline, color, size, highlight
+* **Lists** — unordered, ordered, nested, mixed
+* **Tables** — plain, cell backgrounds, highlights, merged cells
+
+| Feature | Status |
+| :---- | :---- |
+| {cellbg:#c8e6c9}Headings | {cellbg:#c8e6c9}✓ |
+| {cellbg:#c8e6c9}Inline styles | {cellbg:#c8e6c9}✓ |
+| {cellbg:#c8e6c9}Tables | {cellbg:#c8e6c9}✓ |
+| {cellbg:#c8e6c9}Merged cells | {cellbg:#c8e6c9}✓ |
+| {cellbg:#c8e6c9}Highlights | {cellbg:#c8e6c9}✓ |
+
 End of test file.
```

---

## Patch 7 — Modify the highlight-in-lists section

Replaces the first highlighted list item with a different color.

```patch
@@ -111,1 +111,1 @@
-* {highlight:#fff9c4}Highlighted list item{/highlight}
+* {highlight:#b3e5fc}Light blue highlighted list item{/highlight}
```

---

## Patch 8 — Add context note to Escaped Literals section

Inserts a descriptive note paragraph after the "## Escaped Literals" heading.

```patch
@@ -27,1 +27,3 @@
 ## Escaped Literals
+
+The following lines test that markdown special characters are treated as literal text when preceded by a backslash.
+
 Use escaped markdown symbols literally:
```
