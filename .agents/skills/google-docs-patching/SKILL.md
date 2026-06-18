---
name: google-docs-patching
description: Guides AI agents on how to safely read, edit, and patch Google Docs tab contents using the tokenized linear text system and Operational Transformation (OT) or Right-to-Left index translation.
---

# Google Docs Patching Skill

Use this skill when you need to read or update Google Docs contents via the `google-docs-bridge` MCP server. The system uses a **lossless, tokenized linear text pipeline** that preserves formatting, styling, images, and tables.

## Core Concepts

### 1. Tokenized Linear Text
When reading document contents using `getcontents`, the server outputs a clean linear stream of text. Visual and complex structural elements are abstracted as immutable token anchors:
* **Tables**: Represented as `\uFFFC[table:startIndex]\n` (e.g. `￼[table:120]`).
* **Inline Images**: Represented as `\uFFFC[image:objectId]` (e.g. `￼[image:kix.123]`).

> [!IMPORTANT]
> The Object Replacement Character (`\uFFFC` / `￼`) is part of the token structure. You must never modify the internal syntax of these anchors. You can, however, move or delete them as atomic blocks.

### 2. Formatting Preservation
All inline text formatting (bold, italic, font size, colors, highlight, etc.) is preserved automatically. When you insert new text or delete existing text, the system maps the linear indexes back to the true document indices and executes updates non-destructively from **Right-to-Left (descending index order)**.

---

## MCP Tools Reference

### `getcontents`
Reads document content from a specific file and tab.
* **Arguments**:
  * `id` (string, required): The Google Doc file ID.
  * `tabId` (string, required): The tab ID to read (retrievable from document metadata).
  * `startLine` / `endLine` (integers, optional): For chunked reads.
* **Behaviors**: Returns a text stream containing tokenized anchors and list/heading prefixes.

### `apply_structural_edits` (Recommended for Edits)
Applies non-destructive changes using Operational Transformation (OT) operations. This is the **most robust** tool for editing text because it avoids unified diff syntax issues.
* **Arguments**:
  * `id` (string, required): The Google Doc file ID.
  * `tabId` (string, required): The tab ID.
  * `operations` (array of objects, required):
    * `type`: `'retain' | 'insert' | 'delete'`
    * `count` (integer): Number of characters to retain or delete.
    * `text` (string): Text content to insert.

### `applypatch` (DMP/Unified Patches)
Applies a unified diff or DMP patch on the linear text stream.
* **Arguments**:
  * `id` (string, required): The Google Doc file ID.
  * `tabId` (string, required): The tab ID.
  * `patch` (string, required): The patch string.
  * `algorithm` (string, optional): `'unified'` (default) or `'dmp'`.

### `makecopy` (Copy Document)
Creates a copy of an existing Google Doc.
* **Arguments**:
  * `id` (string, required): The source Google Doc ID.
  * `title` (string, optional): The title of the copied document. If not specified, defaults to "Copy of <source title>".
* **Returns**: Metadata of the copied file, including `id`, `title`, `url`, `lastEditedMs`, and `lastEditedIso`.

---

## Best Practices for Agents

### 1. Prefer OT (`apply_structural_edits`)
Writing unified diffs can be error-prone for long paragraphs. Prefer converting your target changes into an array of precise `retain`, `insert`, and `delete` operations and executing them via `apply_structural_edits`.

### 2. Handling Inline Images
* **To Move or Copy an Image**: Copy the exact token anchor `\uFFFC[image:objectId]` and place it in the new text. The system will look up the properties and insert the inline image at the new location.
* **To Insert a Brand New Image**: Insert the token `\uFFFC[image:new src="https://url-to-image"]`. The system will fetch the image, upload it as a temporary public Drive file, insert it, and clean up the temporary file.

### 3. Deleting Structures
To delete a table or image, simply delete the entire token anchor (including the `\uFFFC` character) in your edit or deletion operation.
