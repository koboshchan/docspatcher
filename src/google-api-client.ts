import { getOrRefreshToken, invalidateToken } from './token-manager.js';
import { FileMetadata } from './types.js';
import { resolveImageUrl, parseStyleTagsAndPrefixes, namedStyleTypeFromHeadingLevel, hexToRgbColor, resolveDocTabContext, isEmptyParagraph } from './patch-engine.js';

async function makeRestRequest(method: string, url: string, body?: any, retried = false): Promise<any> {
  const token = await getOrRefreshToken();
  const options: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  if (body !== undefined) {
    options.headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    };
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (response.status === 401 && !retried) {
    console.log('Token unauthorized (401). Invalidating and retrying...');
    invalidateToken();
    return makeRestRequest(method, url, body, true);
  }

  const text = await response.text();

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`Google API request failed (${response.status}): ${text}`);
  }

  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { text };
  }
}

export async function docsApiGetDocument(documentId: string, includeTabsContent = true): Promise<any> {
  const query = includeTabsContent ? '?includeTabsContent=true' : '';
  const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}${query}`;
  return makeRestRequest('GET', url);
}

export async function docsApiBatchUpdate(documentId: string, requests: any[]): Promise<any> {
  const url = `https://docs.googleapis.com/v1/documents/${encodeURIComponent(documentId)}:batchUpdate`;
  return makeRestRequest('POST', url, { requests });
}

export async function getFiles(limit = 10): Promise<FileMetadata[]> {
  const url = `https://www.googleapis.com/drive/v3/files?q=mimeType%20%3D%20%27application%2Fvnd.google-apps.document%27%20and%20trashed%20%3D%20false&orderBy=modifiedTime%20desc&pageSize=${limit}&fields=files(id%2Cname%2CwebViewLink%2CmodifiedTime)`;
  const data = await makeRestRequest('GET', url);
  return (data.files || []).map((f: any) => {
    const updated = new Date(f.modifiedTime);
    return {
      id: f.id,
      name: f.name,
      url: f.webViewLink,
      lastUpdatedMs: updated.getTime(),
      lastUpdatedIso: f.modifiedTime
    };
  });
}

export async function searchFiles(queryStr: string, limit = 10): Promise<FileMetadata[]> {
  const escaped = queryStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const q = `name contains "${escaped}" and trashed = false and mimeType = 'application/vnd.google-apps.document'`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=${limit}&fields=files(id%2Cname%2CwebViewLink%2CmodifiedTime)`;
  const data = await makeRestRequest('GET', url);
  return (data.files || []).map((f: any) => {
    const updated = new Date(f.modifiedTime);
    return {
      id: f.id,
      name: f.name,
      url: f.webViewLink,
      lastUpdatedMs: updated.getTime(),
      lastUpdatedIso: f.modifiedTime
    };
  });
}

export async function renameDoc(id: string, title: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${id}`;
  const data = await makeRestRequest('PATCH', url, { name: title });
  const updated = new Date(data.modifiedTime || Date.now());
  return {
    id: id,
    title: data.name || title,
    url: `https://docs.google.com/document/d/${id}/edit`,
    lastEditedMs: updated.getTime(),
    lastEditedIso: data.modifiedTime || new Date().toISOString()
  };
}

export async function makeCopy(id: string, title?: string): Promise<any> {
  const name = title ? title.trim() : undefined;
  const url = `https://www.googleapis.com/drive/v3/files/${id}/copy`;
  const data = await makeRestRequest('POST', url, name ? { name } : {});
  const updated = new Date(data.modifiedTime || Date.now());
  return {
    id: data.id,
    title: data.name,
    url: `https://docs.google.com/document/d/${data.id}/edit`,
    lastEditedMs: updated.getTime(),
    lastEditedIso: data.modifiedTime || new Date().toISOString()
  };
}

export async function getFileMetadata(id: string): Promise<any> {
  const url = `https://www.googleapis.com/drive/v3/files/${id}?fields=id%2Cname%2CwebViewLink%2CmodifiedTime`;
  return makeRestRequest('GET', url);
}

export async function newDoc(title: string): Promise<any> {
  const url = 'https://docs.googleapis.com/v1/documents';
  const docData = await makeRestRequest('POST', url, { title });
  
  // Retrieve additional metadata
  const driveUrl = `https://www.googleapis.com/drive/v3/files/${docData.documentId}?fields=id%2Cname%2CwebViewLink%2CmodifiedTime`;
  const driveData = await makeRestRequest('GET', driveUrl);
  const updated = new Date(driveData.modifiedTime || Date.now());
  
  return {
    id: docData.documentId,
    title: driveData.name || title,
    url: driveData.webViewLink || `https://docs.google.com/document/d/${docData.documentId}/edit`,
    lastEditedMs: updated.getTime(),
    lastEditedIso: driveData.modifiedTime || new Date().toISOString()
  };
}

export async function uploadTemporaryImage(imgUrl: string): Promise<string> {
  const token = await getOrRefreshToken();
  const imgResp = await fetch(imgUrl);
  if (imgResp.status !== 200) {
    throw new Error(`Failed to download image from ${imgUrl}`);
  }
  const blob = await imgResp.blob();
  
  // Construct multipart upload
  const metadata = {
    name: `tmp_mcp_image_${Date.now()}`,
    mimeType: blob.type || 'image/png'
  };
  
  const formData = new FormData();
  formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  formData.append('file', blob);
  
  const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const uploadResp = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData
  });
  
  if (uploadResp.status < 200 || uploadResp.status >= 300) {
    const text = await uploadResp.text();
    throw new Error(`Failed to upload temporary image to Drive: ${text}`);
  }
  
  const fileData = await uploadResp.json() as any;
  const fileId = fileData.id;
  
  // Set sharing permissions so it can be accessed by the Docs service to embed it
  const permUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
  const permResp = await fetch(permUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });
  
  if (permResp.status < 200 || permResp.status >= 300) {
    const text = await permResp.text();
    // try deleting before throwing
    try { await deleteDriveFile(fileId); } catch (_) {}
    throw new Error(`Failed to set public permissions on temporary image: ${text}`);
  }
  
  return fileId;
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getOrRefreshToken();
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function applyDocOpsToDocument(
  documentId: string,
  tabContext: any,
  docOps: any[]
): Promise<number> {
  const insertTableOps = docOps.filter(op => op.type === 'insert_table');
  const otherOps = docOps.filter(op => op.type !== 'insert_table');

  // Phase 1: Apply all non-table insertions/deletions (this grows the doc and creates placeholders)
  const phase1Ops = [...otherOps];
  phase1Ops.sort((a, b) => {
    const idxA = a.type === 'delete' ? a.startIndex : a.index;
    const idxB = b.type === 'delete' ? b.startIndex : b.index;
    if (idxB !== idxA) {
      return idxB - idxA;
    }
    if (a.type !== b.type) {
      return a.type === 'delete' ? -1 : 1;
    }
    return 0;
  });

  const requests: any[] = [];
  const tempFileIds: string[] = [];

  try {
    for (let i = 0; i < phase1Ops.length; i++) {
      const op = phase1Ops[i];
      if (op.type === 'delete') {
        const range: any = { startIndex: op.startIndex, endIndex: op.endIndex };
        if (tabContext.tabId) range.tabId = tabContext.tabId;
        requests.push({ deleteContentRange: { range } });
      } else if (op.type === 'insert_text') {
        const location: any = { index: op.index };
        if (tabContext.tabId) location.tabId = tabContext.tabId;
        requests.push({ insertText: { location, text: op.text } });
      } else if (op.type === 'insert_image') {
        let url = '';
        if (op.src) {
          url = op.src;
        } else {
          url = resolveImageUrl({ id: op.objectId }, tabContext.inlineObjects);
        }

        if (url) {
          if (/googleusercontent\.com/i.test(url)) {
            try {
              const fileId = await uploadTemporaryImage(url);
              tempFileIds.push(fileId);
              url = `https://drive.google.com/uc?export=download&id=${fileId}`;
            } catch (err) {
              console.error('Failed to resolve image to public Drive url:', err);
              url = '';
            }
          }
          
          if (url) {
            const location: any = { index: op.index };
            if (tabContext.tabId) location.tabId = tabContext.tabId;
            requests.push({
              insertInlineImage: {
                location,
                uri: url
              }
            });
          }
        }
      }
    }

    if (requests.length > 0) {
      await docsApiBatchUpdate(documentId, requests);
    }

    let totalRequests = requests.length;

    // Phase 2: Insert empty table structures & delete placeholders
    if (insertTableOps.length > 0) {
      const phase2StructureRequests: any[] = [];
      const sortedInsertTableOps = [...insertTableOps].sort((a, b) => b.index - a.index);
      
      for (const op of sortedInsertTableOps) {
        const range: any = { startIndex: op.index, endIndex: op.index + 1 };
        if (tabContext.tabId) range.tabId = tabContext.tabId;
        phase2StructureRequests.push({ deleteContentRange: { range } });

        const location: any = { index: op.index };
        if (tabContext.tabId) location.tabId = tabContext.tabId;
        phase2StructureRequests.push({
          insertTable: {
            rows: op.rows,
            columns: op.cols,
            location
          }
        });
      }

      if (phase2StructureRequests.length > 0) {
        await docsApiBatchUpdate(documentId, phase2StructureRequests);
        totalRequests += phase2StructureRequests.length;
      }

      // Phase 3: Insert empty table cells' plain text
      const updatedDoc = await docsApiGetDocument(documentId, true);
      const updatedTabContext = resolveDocTabContext(updatedDoc, tabContext.tabId);

      const updatedContent = updatedTabContext.content || [];
      const updatedTables = updatedContent.filter((block: any) => block.table);

      // Sort insertTableOps ascending to calculate cumulative length shift correctly
      const ascendingInsertTableOps = [...insertTableOps].sort((a, b) => a.index - b.index);
      const phase3Requests: any[] = [];
      let cumulativeTableLengthShift = 0;

      for (const op of ascendingInsertTableOps) {
        const expectedStartIndex = op.index + cumulativeTableLengthShift;
        const matchTable = updatedTables.find((tb: any) => Math.abs(Number(tb.startIndex) - expectedStartIndex) <= 5);
        if (!matchTable) {
          console.warn(`Could not find empty table near expected index ${expectedStartIndex}`);
          continue;
        }

        const actualStartIndex = Number(matchTable.startIndex);
        const tableLen = Number(matchTable.endIndex) - actualStartIndex;
        cumulativeTableLengthShift += (tableLen - 1);

        const rows = matchTable.table.tableRows || [];
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const cells = row.tableCells || [];
          for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];
            const cellText = op.cells?.[r]?.[c] || '';
            const cellStartIndex = Number(cell.startIndex);

            if (cellText) {
              const parsed = parseStyleTagsAndPrefixes(cellText, true);
              let plainText = parsed.plainText;
              if (plainText.endsWith('\n')) {
                plainText = plainText.slice(0, -1);
              }

              if (plainText.length > 0) {
                const location: any = { index: cellStartIndex + 1 };
                if (tabContext.tabId) location.tabId = tabContext.tabId;
                phase3Requests.push({
                  insertText: {
                    location,
                    text: plainText
                  }
                });
              }
            }
          }
        }
      }

      if (phase3Requests.length > 0) {
        // Sort descending by index
        phase3Requests.sort((a, b) => b.insertText.location.index - a.insertText.location.index);
        await docsApiBatchUpdate(documentId, phase3Requests);
        totalRequests += phase3Requests.length;
      }

      // Phase 4: Apply styling and formatting (background color, paragraph style, text style)
      const styledDoc = await docsApiGetDocument(documentId, true);
      const styledTabContext = resolveDocTabContext(styledDoc, tabContext.tabId);

      const styledContent = styledTabContext.content || [];
      const styledTables = styledContent.filter((block: any) => block.table);

      const phase4Requests: any[] = [];
      let cumulativeTableLengthShift4 = 0;

      for (const op of ascendingInsertTableOps) {
        const expectedStartIndex = op.index + cumulativeTableLengthShift4;
        const matchTable = styledTables.find((tb: any) => Math.abs(Number(tb.startIndex) - expectedStartIndex) <= 5);
        if (!matchTable) {
          console.warn(`Could not find table for styling near expected index ${expectedStartIndex}`);
          continue;
        }

        const actualStartIndex = Number(matchTable.startIndex);
        const tableLen = Number(matchTable.endIndex) - actualStartIndex;
        cumulativeTableLengthShift4 += (tableLen - 1);

        const rows = matchTable.table.tableRows || [];
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const cells = row.tableCells || [];
          for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];
            const cellText = op.cells?.[r]?.[c] || '';
            const cellBg = op.backgroundColors?.[r]?.[c] || 'default';
            const cellStartIndex = Number(cell.startIndex);

            // 1. Background color
            if (cellBg !== 'default') {
              const rgb = hexToRgbColor(cellBg);
              if (rgb) {
                const tableStartLocation: any = { index: actualStartIndex };
                if (tabContext.tabId) tableStartLocation.tabId = tabContext.tabId;
                phase4Requests.push({
                  updateTableCellStyle: {
                    tableCellStyle: {
                      backgroundColor: {
                        color: {
                          rgbColor: rgb
                        }
                      }
                    },
                    fields: 'backgroundColor',
                    tableRange: {
                      tableCellLocation: {
                        tableStartLocation,
                        rowIndex: r,
                        columnIndex: c
                      },
                      rowSpan: 1,
                      columnSpan: 1
                    }
                  }
                });
              }
            }

            // 2. Styling
            if (cellText) {
              const parsed = parseStyleTagsAndPrefixes(cellText, true);

              // Paragraph styles
              const pStyle: any = {};
              let pFields = '';
              if (parsed.paragraphStyles.align) {
                pStyle.alignment = parsed.paragraphStyles.align;
                pFields += 'alignment,';
              }
              if (parsed.paragraphStyles.heading !== undefined) {
                pStyle.namedStyleType = namedStyleTypeFromHeadingLevel(parsed.paragraphStyles.heading);
                pFields += 'namedStyleType,';
              }

              if (pFields) {
                const range: any = { startIndex: cellStartIndex + 1, endIndex: cellStartIndex + 2 };
                if (tabContext.tabId) range.tabId = tabContext.tabId;
                phase4Requests.push({
                  updateParagraphStyle: {
                    paragraphStyle: pStyle,
                    fields: pFields.slice(0, -1),
                    range
                  }
                });
              }

              // Text styles
              for (const styleRange of parsed.styles) {
                const start = cellStartIndex + 1 + styleRange.startIndex;
                const end = cellStartIndex + 1 + styleRange.endIndex;
                if (end > start) {
                  const range: any = { startIndex: start, endIndex: end };
                  if (tabContext.tabId) range.tabId = tabContext.tabId;

                  const textStyle: any = {};
                  let textFields = '';

                  if (styleRange.styleName === 'bold') {
                    textStyle.bold = styleRange.value;
                    textFields = 'bold';
                  } else if (styleRange.styleName === 'italic') {
                    textStyle.italic = styleRange.value;
                    textFields = 'italic';
                  } else if (styleRange.styleName === 'underline') {
                    textStyle.underline = styleRange.value;
                    textFields = 'underline';
                  } else if (styleRange.styleName === 'strikethrough') {
                    textStyle.strikethrough = styleRange.value;
                    textFields = 'strikethrough';
                  } else if (styleRange.styleName === 'fontSize') {
                    if (styleRange.value === 'default') {
                      textStyle.fontSize = { magnitude: 11, unit: 'PT' };
                    } else {
                      textStyle.fontSize = { magnitude: styleRange.value, unit: 'PT' };
                    }
                    textFields = 'fontSize';
                  } else if (styleRange.styleName === 'color') {
                    if (styleRange.value === 'default') {
                      textStyle.foregroundColor = {};
                    } else {
                      const rgb = hexToRgbColor(styleRange.value);
                      if (rgb) {
                        textStyle.foregroundColor = {
                          color: {
                            rgbColor: rgb
                          }
                        };
                      }
                    }
                    textFields = 'foregroundColor';
                  }

                  if (textFields) {
                    phase4Requests.push({
                      updateTextStyle: {
                        textStyle,
                        fields: textFields,
                        range
                      }
                    });
                  }
                }
              }
            }
          }
        }
      }

      if (phase4Requests.length > 0) {
        console.log("Phase 4 Requests:", JSON.stringify(phase4Requests, null, 2));
        await docsApiBatchUpdate(documentId, phase4Requests);
        totalRequests += phase4Requests.length;
      }
    }

    return totalRequests;
  } finally {
    for (const fileId of tempFileIds) {
      try {
        await deleteDriveFile(fileId);
      } catch (err) {
        console.error(`Failed to clean up temporary file ${fileId}:`, err);
      }
    }
  }
}

export async function syncDocumentStyles(
  documentId: string,
  tabId: string | null,
  newLinearText: string
): Promise<number> {
  // Resolve tab context and paragraphs
  let tabIdOrNull = tabId;
  if (tabIdOrNull === '') tabIdOrNull = null;
  
  const freshDoc = await docsApiGetDocument(documentId, true);
  
  let content: any[] = [];
  let targetTabId: string | null = null;

  if (!tabIdOrNull) {
    content = (freshDoc && freshDoc.body && freshDoc.body.content) || [];
    targetTabId = null;
  } else {
    const match = findTabById((freshDoc && freshDoc.tabs) || [], tabIdOrNull);
    if (match) {
      const tab = match.tab;
      const docTab = (tab && tab.documentTab) || {};
      content = (docTab && docTab.body && docTab.body.content) || [];
      targetTabId = tabIdOrNull;
    } else {
      content = (freshDoc && freshDoc.body && freshDoc.body.content) || [];
      targetTabId = null;
    }
  }

  const rawDocBlocks = content.filter((b: any) => b.paragraph || b.table);
  const lines = newLinearText.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop(); // remove trailing newline split
  }

  const docBlocks: any[] = [];
  let blockIdx = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip any empty paragraph that immediately precedes a table in rawDocBlocks,
    // because we skipped exporting it!
    while (
      blockIdx < rawDocBlocks.length - 1 &&
      rawDocBlocks[blockIdx].paragraph &&
      isEmptyParagraph(rawDocBlocks[blockIdx].paragraph) &&
      rawDocBlocks[blockIdx + 1].table
    ) {
      blockIdx++;
    }

    if (blockIdx >= rawDocBlocks.length) break;

    const block = rawDocBlocks[blockIdx];
    if (line.startsWith('{{table:')) {
      // Expect table block. Skip any placeholder/padding empty paragraphs
      while (blockIdx < rawDocBlocks.length && !rawDocBlocks[blockIdx].table) {
        blockIdx++;
      }
      if (blockIdx < rawDocBlocks.length) {
        docBlocks.push(rawDocBlocks[blockIdx]);
        blockIdx++;
      }
    } else {
      docBlocks.push(block);
      blockIdx++;
    }
  }

  console.log(`[syncDocumentStyles] tabId=${tabId}, resolved targetTabId=${targetTabId}`);
  console.log(`[syncDocumentStyles] lines.length=${lines.length}, docBlocks.length=${docBlocks.length}`);

  const stylingRequests: any[] = [];
  const bulletRequests: any[] = [];

  let currentListStart = -1;
  let currentListEnd = -1;
  let currentListType: 'bullet' | 'ordered' | null = null;

  for (let i = 0; i < Math.min(lines.length, docBlocks.length); i++) {
    const line = lines[i];
    const block = docBlocks[i];
    if (!block.paragraph) {
      continue;
    }
    const paragraph = block.paragraph;
    const docStart = Number(block.startIndex);
    const docEnd = Number(block.endIndex);

    // Parse styling for this line
    const parsed = parseStyleTagsAndPrefixes(line);

    // 1. Paragraph style updates (alignment & heading)
    const pStyle: any = {};
    let fields = '';

    if (parsed.paragraphStyles.align) {
      pStyle.alignment = parsed.paragraphStyles.align;
      fields += 'alignment,';
    }
    if (parsed.paragraphStyles.heading !== undefined) {
      pStyle.namedStyleType = namedStyleTypeFromHeadingLevel(parsed.paragraphStyles.heading);
      fields += 'namedStyleType,';
    }

    if (fields) {
      const range: any = { startIndex: docStart, endIndex: docEnd };
      if (targetTabId) range.tabId = targetTabId;
      stylingRequests.push({
        updateParagraphStyle: {
          paragraphStyle: pStyle,
          fields: fields.slice(0, -1),
          range
        }
      });
    }

    // 2. List bullet creation/deletion
    if (paragraph.bullet && !parsed.listInfo.listType) {
      const range: any = { startIndex: docStart, endIndex: docEnd };
      if (targetTabId) range.tabId = targetTabId;
      stylingRequests.push({
        deleteParagraphBullets: {
          range
        }
      });
    }

    const listType = parsed.listInfo.listType;
    if (listType !== currentListType) {
      if (currentListType && currentListStart !== -1) {
        const preset = currentListType === 'bullet' ? 'BULLET_DISC_CIRCLE_SQUARE' : 'NUMBERED_DECIMAL_NESTED';
        const range: any = { startIndex: currentListStart, endIndex: currentListEnd };
        if (targetTabId) range.tabId = targetTabId;
        bulletRequests.push({
          createParagraphBullets: {
            range,
            bulletPreset: preset
          }
        });
      }
      if (listType) {
        currentListStart = docStart;
        currentListEnd = docEnd;
        currentListType = listType;
      } else {
        currentListStart = -1;
        currentListEnd = -1;
        currentListType = null;
      }
    } else {
      if (listType) {
        currentListEnd = docEnd;
      }
    }

    // 3. Inline style updates
    for (const styleRange of parsed.styles) {
      const start = docStart + styleRange.startIndex;
      const end = docStart + styleRange.endIndex;

      if (end > start) {
        const range: any = { startIndex: start, endIndex: end };
        if (targetTabId) range.tabId = targetTabId;

        const textStyle: any = {};
        let textFields = '';

        if (styleRange.styleName === 'bold') {
          textStyle.bold = styleRange.value;
          textFields = 'bold';
        } else if (styleRange.styleName === 'italic') {
          textStyle.italic = styleRange.value;
          textFields = 'italic';
        } else if (styleRange.styleName === 'underline') {
          textStyle.underline = styleRange.value;
          textFields = 'underline';
        } else if (styleRange.styleName === 'strikethrough') {
          textStyle.strikethrough = styleRange.value;
          textFields = 'strikethrough';
        } else if (styleRange.styleName === 'fontSize') {
          if (styleRange.value === 'default') {
            textStyle.fontSize = { magnitude: 11, unit: 'PT' };
          } else {
            textStyle.fontSize = { magnitude: styleRange.value, unit: 'PT' };
          }
          textFields = 'fontSize';
        } else if (styleRange.styleName === 'color') {
          if (styleRange.value === 'default') {
            textStyle.foregroundColor = {};
          } else {
            const rgb = hexToRgbColor(styleRange.value);
            if (rgb) {
              textStyle.foregroundColor = {
                color: {
                  rgbColor: rgb
                }
              };
            }
          }
          textFields = 'foregroundColor';
        }

        if (textFields) {
          stylingRequests.push({
            updateTextStyle: {
              textStyle,
              fields: textFields,
              range
            }
          });
        }
      }
    }
  }

  if (currentListType && currentListStart !== -1) {
    const preset = currentListType === 'bullet' ? 'BULLET_DISC_CIRCLE_SQUARE' : 'NUMBERED_DECIMAL_NESTED';
    const range: any = { startIndex: currentListStart, endIndex: currentListEnd };
    if (targetTabId) range.tabId = targetTabId;
    bulletRequests.push({
      createParagraphBullets: {
        range,
        bulletPreset: preset
      }
    });
  }

  if (stylingRequests.length > 0) {
    console.log(`[syncDocumentStyles] Sending batchUpdate with ${stylingRequests.length} styling requests`);
    await docsApiBatchUpdate(documentId, stylingRequests);
  }

  if (bulletRequests.length > 0) {
    // Sort bullet requests descending by start index (Right-to-Left) to ensure index stability
    bulletRequests.sort((a, b) => b.createParagraphBullets.range.startIndex - a.createParagraphBullets.range.startIndex);
    console.log(`[syncDocumentStyles] Sending batchUpdate with ${bulletRequests.length} bullet requests`);
    await docsApiBatchUpdate(documentId, bulletRequests);
  }

  return stylingRequests.length + bulletRequests.length;
}

function findTabById(tabs: any[], tabId: string): any {
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];
    if (!tab) continue;
    const props = tab.tabProperties || {};
    const id = String(props.tabId || tab.tabId || '');
    if (id === tabId) return { tab };
    const children = tab.childTabs || [];
    const nested = findTabById(children, tabId);
    if (nested) return nested;
  }
  return null;
}

/**
 * Fill specific cells in an existing table in a Google Doc using raw batchUpdate.
 *
 * @param documentId  - The document ID
 * @param tabId       - Tab ID (e.g. 't.0') or null for document body
 * @param tableIndex  - 0-based index of the table within the tab content (i.e., the Nth table)
 * @param cellFills   - Array of { row, col, text, colorHex? } to fill
 */
export async function fillTableCells(
  documentId: string,
  tabId: string | null,
  tableIndex: number,
  cellFills: Array<{ row: number; col: number; text: string; colorHex?: string }>
): Promise<number> {
  const doc = await docsApiGetDocument(documentId, true);
  const tabContext = resolveDocTabContext(doc, tabId);
  const content = tabContext.content || [];
  const tables = content.filter((block: any) => block.table);

  if (tableIndex >= tables.length) {
    throw new Error(`Table index ${tableIndex} out of range (found ${tables.length} tables)`);
  }

  const table = tables[tableIndex];
  const rows = table.table.tableRows || [];
  const requests: any[] = [];

  for (const fill of cellFills) {
    const { row, col, text, colorHex } = fill;
    const tableRow = rows[row];
    if (!tableRow) { console.warn(`Row ${row} not found in table`); continue; }
    const cells = tableRow.tableCells || [];
    const cell = cells[col];
    if (!cell) { console.warn(`Col ${col} not found in row ${row}`); continue; }

    const cellStartIndex = Number(cell.startIndex);

    // Check if cell already has non-empty content
    const existingContent = (cell.content || []);
    let existingText = '';
    for (const elem of existingContent) {
      for (const pe of (elem.paragraph?.elements || [])) {
        existingText += pe.textRun?.content || '';
      }
    }
    const plainExisting = existingText.replace(/\n/g, '').trim();

    if (plainExisting.length > 0) {
      console.log(`  Cell [${row}][${col}] already has content, skipping`);
      continue;
    }

    // Insert text at cellStartIndex + 1
    const insertIndex = cellStartIndex + 1;
    const location: any = { index: insertIndex };
    if (tabId) location.tabId = tabId;

    requests.push({
      insertText: { location, text }
    });

    // Apply color styling if requested
    if (colorHex) {
      const rgb = hexToRgbColor(colorHex);
      if (rgb) {
        const range: any = { startIndex: insertIndex, endIndex: insertIndex + text.length };
        if (tabId) range.tabId = tabId;
        requests.push({
          updateTextStyle: {
            textStyle: {
              foregroundColor: { color: { rgbColor: rgb } },
              fontSize: { magnitude: 11, unit: 'PT' }
            },
            fields: 'foregroundColor,fontSize',
            range
          }
        });
      }
    }
  }

  if (requests.length === 0) {
    console.log('  No cells to fill');
    return 0;
  }

  // Sort insert requests descending by index so later inserts don't shift earlier ones
  requests.sort((a, b) => {
    const aIdx = a.insertText?.location?.index ?? a.updateTextStyle?.range?.startIndex ?? 0;
    const bIdx = b.insertText?.location?.index ?? b.updateTextStyle?.range?.startIndex ?? 0;
    return bIdx - aIdx;
  });

  await docsApiBatchUpdate(documentId, requests);
  return requests.length;
}

