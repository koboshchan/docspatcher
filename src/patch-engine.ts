import { DiffMatchPatch, DiffOp } from 'diff-match-patch-ts';
import { DocElementMap, LinearOperation, OtOperation, TabContext } from './types.js';

const dmp = new DiffMatchPatch();

export function normalizeContentFormat(format?: string): 'markdown' {
  const value = String(format || 'markdown').toLowerCase();
  if (value && value !== 'markdown') {
    throw new Error('Only markdown format is supported. Omit `format` or use `markdown`.');
  }
  return 'markdown';
}

export function getHexFromRgb(rgb: any): string {
  if (!rgb) return 'default';
  const red = Math.round((rgb.red || 0) * 255);
  const green = Math.round((rgb.green || 0) * 255);
  const blue = Math.round((rgb.blue || 0) * 255);
  return '#' + [red, green, blue]
    .map(x => x.toString(16).padStart(2, '0').toUpperCase())
    .join('');
}

export function extractHexColor(textStyle: any): string {
  const fg = textStyle?.foregroundColor;
  const rgb = fg?.color?.rgbColor;
  if (rgb) {
    return getHexFromRgb(rgb);
  }
  return 'default';
}

export function extractFontSize(textStyle: any): number | 'default' {
  const fs = textStyle?.fontSize;
  if (fs) {
    if (typeof fs.magnitude === 'number') {
      return fs.magnitude;
    }
    if (typeof fs.size === 'number') {
      return fs.size;
    }
  }
  return 'default';
}

export function headingLevelFromNamedStyleType(namedStyleType?: string): number {
  const type = String(namedStyleType || '');
  if (type === 'TITLE') return 1;
  if (type === 'SUBTITLE') return 2;

  const m = /^HEADING_(\d)$/.exec(type);
  if (!m) return 0;
  return Math.max(1, Math.min(4, Number(m[1]) || 1));
}

export function namedStyleTypeFromHeadingLevel(headingLevel: number): string {
  const lvl = Number(headingLevel);
  if (lvl === 0) return 'NORMAL_TEXT';
  const level = Math.max(1, Math.min(4, lvl || 1));
  return 'HEADING_' + level;
}

export function markdownHeadingPrefixFromParagraph(paragraph: any): string {
  const style = paragraph && paragraph.paragraphStyle;
  const level = headingLevelFromNamedStyleType(style && style.namedStyleType);
  if (!level) return '';
  return '#'.repeat(level) + ' ';
}

export function markdownAlignmentPrefixFromParagraph(paragraph: any): string {
  const style = paragraph && paragraph.paragraphStyle;
  const alignment = String((style && style.alignment) || '').toUpperCase();
  if (alignment === 'CENTER') return '{align:center}';
  if (alignment === 'RIGHT') return '{align:right}';
  if (alignment === 'JUSTIFIED') return '{align:justify}';
  return '';
}

export function markdownListPrefixFromParagraph(
  paragraph: any,
  listsById: any,
  listState: { counters: Record<string, number> }
): string {
  if (!paragraph || !paragraph.bullet) return '';

  const level = Math.max(0, Number(paragraph.bullet.nestingLevel) || 0);
  const indent = '\t'.repeat(level);
  const ordered = isOrderedListParagraph(paragraph, listsById);

  if (!ordered) return indent + '{{list:bullet}}';
  return indent + '{{list:ordered}}';
}

export function isOrderedListParagraph(paragraph: any, listsById: any): boolean {
  if (!paragraph || !paragraph.bullet) return false;

  const listId = paragraph.bullet.listId;
  const level = Math.max(0, Number(paragraph.bullet.nestingLevel) || 0);
  const list = listId && listsById && listsById[listId];
  const nesting =
    list &&
    list.listProperties &&
    list.listProperties.nestingLevels &&
    list.listProperties.nestingLevels[level];
  const glyphType = String(nesting && nesting.glyphType ? nesting.glyphType : '');

  return /DECIMAL|ALPHA|ROMAN|NUMBER/i.test(glyphType);
}

export function isEmptyParagraph(paragraph: any): boolean {
  if (!paragraph) return true;
  if (paragraph.bullet) return false;
  const elements = paragraph.elements || [];
  if (elements.length === 0) return true;
  if (elements.length > 1) return false;
  const el = elements[0];
  if (!el) return true;
  if (el.inlineObjectElement) return false;
  if (el.textRun) {
    const content = el.textRun.content || '';
    return content === '\n' || content === '';
  }
  return true;
}

export function docsApiAlignmentFromString(alignment?: string): string | null {
  const a = String(alignment || '').toLowerCase();
  if (a === 'center' || a === 'middle') return 'CENTER';
  if (a === 'right') return 'RIGHT';
  if (a === 'justify') return 'JUSTIFIED';
  if (a === 'left') return 'START';
  return null;
}

export function hexToRgbColor(hex?: string): { red: number; green: number; blue: number } | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(String(hex || '').trim());
  if (!m) return null;
  const raw = m[1];
  return {
    red: parseInt(raw.substring(0, 2), 16) / 255,
    green: parseInt(raw.substring(2, 4), 16) / 255,
    blue: parseInt(raw.substring(4, 6), 16) / 255,
  };
}

export function resolveImageUrl(img: { id: string; url?: string }, inlineObjects: any): string {
  if (img.url) return img.url;
  if (!img.id || !inlineObjects) return '';
  const obj = inlineObjects[img.id];
  const embedded = obj && obj.inlineObjectProperties && obj.inlineObjectProperties.embeddedObject;
  return (embedded && embedded.imageProperties && embedded.imageProperties.contentUri) || '';
}

export function listAvailableTabs(doc: any): any[] {
  const out: any[] = [];
  const tabs = (doc && doc.tabs) || [];

  function walk(tabList: any[], parentTabId: string | null) {
    for (let i = 0; i < tabList.length; i++) {
      const tab = tabList[i];
      if (!tab) continue;
      const props = tab.tabProperties || {};
      const id = String(props.tabId || tab.tabId || '');
      const title = String(props.title || tab.title || '');
      const index = Number(props.index);

      out.push({
        id: id || null,
        title: title || null,
        index: Number.isFinite(index) ? index : out.length,
        parentTabId: parentTabId || null,
      });

      const children = tab.childTabs || [];
      if (children.length > 0) walk(children, id || null);
    }
  }

  walk(tabs, null);
  return out;
}

export function resolveDocTabContext(
  doc: any,
  requestedTabId?: string
): TabContext & { inlineObjects: any; tabName: string | null } {
  const selectedTabId = String(requestedTabId || '').trim();
  const bodyContent = (doc && doc.body && doc.body.content) || [];
  const listsById = (doc && doc.lists) || {};
  const inlineObjects = (doc && doc.inlineObjects) || {};

  if (!selectedTabId) {
    return {
      tabId: '',
      title: 'Document Body',
      index: 0,
      content: bodyContent,
      listsById,
      inlineObjects,
      tabName: null,
    };
  }

  const match = findTabById((doc && doc.tabs) || [], selectedTabId);
  if (!match) {
    throw new Error('tabId not found: ' + selectedTabId);
  }

  const tab = match.tab;
  const props = (tab && tab.tabProperties) || {};
  const docTab = (tab && tab.documentTab) || {};
  return {
    tabId: String(props.tabId || selectedTabId),
    title: String(props.title || tab.title || ''),
    index: Number(props.index) || 0,
    content: (docTab && docTab.body && docTab.body.content) || [],
    listsById: (docTab && docTab.lists) || listsById,
    inlineObjects: (docTab && docTab.inlineObjects) || inlineObjects,
    tabName: String(props.title || tab.title || ''),
  };
}

export function findTabById(tabs: any[], tabId: string): any {
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

export function linearizeParagraphToText(
  paragraph: any,
  listsById: any,
  listState: { counters: Record<string, number> }
): string {
  let paraLinearText = '';

  const style = paragraph.paragraphStyle;
  const align = style?.alignment;
  let alignTag = '';
  if (align === 'CENTER') alignTag = '{{align:center}}';
  else if (align === 'RIGHT') alignTag = '{{align:right}}';
  else if (align === 'JUSTIFIED') alignTag = '{{align:justify}}';
  else if (align === 'START') alignTag = '{{align:left}}';

  const level = headingLevelFromNamedStyleType(style?.namedStyleType);
  let headingTag = '';
  if (level > 0) {
    headingTag = `{{heading:${level}}}`;
  } else if (style?.namedStyleType === 'NORMAL_TEXT') {
    headingTag = `{{heading:0}}`;
  }

  paraLinearText += alignTag + headingTag;

  const listPrefix = markdownListPrefixFromParagraph(paragraph, listsById, listState);
  paraLinearText += listPrefix;

  let activeStyle = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    color: 'default',
    fontSize: 'default' as number | 'default'
  };

  const elements = paragraph.elements || [];
  for (let j = 0; j < elements.length; j++) {
    const el = elements[j];
    if (!el) continue;

    if (el.inlineObjectElement) {
      const objectId = el.inlineObjectElement.inlineObjectId;
      paraLinearText += '\uFFFC[image:' + objectId + ']';
    } else if (el.textRun) {
      const runStyle = el.textRun.textStyle || {};
      const bold = !!runStyle.bold;
      const italic = !!runStyle.italic;
      const underline = !!runStyle.underline;
      const strikethrough = !!runStyle.strikethrough;
      const color = extractHexColor(runStyle);
      const fontSize = extractFontSize(runStyle);

      let styleTags = '';
      if (bold !== activeStyle.bold) {
        styleTags += `{{bold:${bold}}}`;
        activeStyle.bold = bold;
      }
      if (italic !== activeStyle.italic) {
        styleTags += `{{italic:${italic}}}`;
        activeStyle.italic = italic;
      }
      if (underline !== activeStyle.underline) {
        styleTags += `{{underline:${underline}}}`;
        activeStyle.underline = underline;
      }
      if (strikethrough !== activeStyle.strikethrough) {
        styleTags += `{{strikethrough:${strikethrough}}}`;
        activeStyle.strikethrough = strikethrough;
      }
      if (color !== activeStyle.color) {
        styleTags += `{{color:${color}}}`;
        activeStyle.color = color;
      }
      if (fontSize !== activeStyle.fontSize) {
        styleTags += `{{fontSize:${fontSize}}}`;
        activeStyle.fontSize = fontSize;
      }

      paraLinearText += styleTags;

      const contentText = el.textRun.content || '';
      const endsWithNL = contentText.endsWith('\n');
      const runText = endsWithNL ? contentText.slice(0, -1) : contentText;
      paraLinearText += runText;
    }
  }

  if (activeStyle.bold) paraLinearText += '{{bold:false}}';
  if (activeStyle.italic) paraLinearText += '{{italic:false}}';
  if (activeStyle.underline) paraLinearText += '{{underline:false}}';
  if (activeStyle.strikethrough) paraLinearText += '{{strikethrough:false}}';
  if (activeStyle.color !== 'default') paraLinearText += '{{color:default}}';
  if (activeStyle.fontSize !== 'default') paraLinearText += '{{fontSize:default}}';

  paraLinearText += '\n';
  return paraLinearText;
}

export function linearizeCellContent(content: any[], listsById: any, listState: any): string {
  let cellText = '';
  for (let i = 0; i < content.length; i++) {
    const block = content[i];
    if (block && block.paragraph) {
      cellText += linearizeParagraphToText(block.paragraph, listsById, listState);
    }
  }
  return cellText;
}

export function getLinearTextAndMap(doc: any, tabContext: any): { text: string; elementMap: DocElementMap[] } {
  const content = tabContext.content || [];
  const listsById = tabContext.listsById || {};
  const listState = { counters: {} };

  let linearText = '';
  const elementMap: DocElementMap[] = [];

  for (let i = 0; i < content.length; i++) {
    const block = content[i];
    if (!block) continue;

    if (block.paragraph) {
      // Skip empty paragraph immediately preceding a table block
      const nextBlock = i + 1 < content.length ? content[i + 1] : null;
      if (nextBlock && nextBlock.table && isEmptyParagraph(block.paragraph)) {
        continue;
      }

      const paragraph = block.paragraph;
      const docStart = Number(block.startIndex);
      const docEnd = Number(block.endIndex);

      const linearStart = linearText.length;
      const parts: any[] = [];
      let paraLinearText = '';

      // Emit paragraph-level style tags
      const style = paragraph.paragraphStyle;
      const align = style?.alignment;
      let alignTag = '';
      if (align === 'CENTER') alignTag = '{{align:center}}';
      else if (align === 'RIGHT') alignTag = '{{align:right}}';
      else if (align === 'JUSTIFIED') alignTag = '{{align:justify}}';
      else if (align === 'START') alignTag = '{{align:left}}';

      const level = headingLevelFromNamedStyleType(style?.namedStyleType);
      let headingTag = '';
      if (level > 0) {
        headingTag = `{{heading:${level}}}`;
      } else if (style?.namedStyleType === 'NORMAL_TEXT') {
        headingTag = `{{heading:0}}`;
      }

      const paraPrefixTags = alignTag + headingTag;
      if (paraPrefixTags.length > 0) {
        paraLinearText += paraPrefixTags;
        parts.push({ type: 'prefix', linearLen: paraPrefixTags.length, docLen: 0 });
      }

      // Emit list prefix
      const listPrefix = markdownListPrefixFromParagraph(paragraph, listsById, listState);
      if (listPrefix.length > 0) {
        paraLinearText += listPrefix;
        parts.push({ type: 'prefix', linearLen: listPrefix.length, docLen: 0 });
      }

      // Track active inline styles
      let activeStyle = {
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        color: 'default',
        fontSize: 'default' as number | 'default'
      };

      const elements = paragraph.elements || [];
      for (let j = 0; j < elements.length; j++) {
        const el = elements[j];
        if (!el) continue;

        const elStart = Number(el.startIndex);
        const elEnd = Number(el.endIndex);
        const elLen = elEnd - elStart;

        if (el.inlineObjectElement) {
          const objectId = el.inlineObjectElement.inlineObjectId;
          const token = '\uFFFC[image:' + objectId + ']';
          paraLinearText += token;
          parts.push({
            type: 'image',
            linearLen: token.length,
            docLen: elLen,
            objectId: objectId,
          });
        } else if (el.textRun) {
          const runStyle = el.textRun.textStyle || {};
          const bold = !!runStyle.bold;
          const italic = !!runStyle.italic;
          const underline = !!runStyle.underline;
          const strikethrough = !!runStyle.strikethrough;
          const color = extractHexColor(runStyle);
          const fontSize = extractFontSize(runStyle);

          let styleTags = '';
          if (bold !== activeStyle.bold) {
            styleTags += `{{bold:${bold}}}`;
            activeStyle.bold = bold;
          }
          if (italic !== activeStyle.italic) {
            styleTags += `{{italic:${italic}}}`;
            activeStyle.italic = italic;
          }
          if (underline !== activeStyle.underline) {
            styleTags += `{{underline:${underline}}}`;
            activeStyle.underline = underline;
          }
          if (strikethrough !== activeStyle.strikethrough) {
            styleTags += `{{strikethrough:${strikethrough}}}`;
            activeStyle.strikethrough = strikethrough;
          }
          if (color !== activeStyle.color) {
            styleTags += `{{color:${color}}}`;
            activeStyle.color = color;
          }
          if (fontSize !== activeStyle.fontSize) {
            styleTags += `{{fontSize:${fontSize}}}`;
            activeStyle.fontSize = fontSize;
          }

          if (styleTags.length > 0) {
            paraLinearText += styleTags;
            parts.push({ type: 'prefix', linearLen: styleTags.length, docLen: 0 });
          }

          const contentText = el.textRun.content || '';
          const endsWithNL = contentText.endsWith('\n');
          const runText = endsWithNL ? contentText.slice(0, -1) : contentText;

          if (runText.length > 0) {
            paraLinearText += runText;
            parts.push({
              type: 'text',
              linearLen: runText.length,
              docLen: runText.length,
            });
          }
        }
      }

      // Reset inline styles at paragraph boundary
      let resetTags = '';
      if (activeStyle.bold) resetTags += '{{bold:false}}';
      if (activeStyle.italic) resetTags += '{{italic:false}}';
      if (activeStyle.underline) resetTags += '{{underline:false}}';
      if (activeStyle.strikethrough) resetTags += '{{strikethrough:false}}';
      if (activeStyle.color !== 'default') resetTags += '{{color:default}}';
      if (activeStyle.fontSize !== 'default') resetTags += '{{fontSize:default}}';

      if (resetTags.length > 0) {
        paraLinearText += resetTags;
        parts.push({ type: 'prefix', linearLen: resetTags.length, docLen: 0 });
      }

      paraLinearText += '\n';
      parts.push({ type: 'terminator', linearLen: 1, docLen: 1 });

      linearText += paraLinearText;
      const linearEnd = linearText.length;

      elementMap.push({
        type: 'text',
        linearStart: linearStart,
        linearEnd: linearEnd,
        docStart: docStart,
        docEnd: docEnd,
        ...({ parts } as any),
      });
    } else if (block.table) {
      const docStart = Number(block.startIndex);
      const docEnd = Number(block.endIndex);

      const rows = block.table.rows || block.table.tableRows?.length || 0;
      const cols = block.table.columns || block.table.tableRows?.[0]?.tableCells?.length || 0;

      const backgroundColors: string[][] = [];
      const cells: string[][] = [];

      const tableRows = block.table.tableRows || [];
      for (let r = 0; r < tableRows.length; r++) {
        const row = tableRows[r];
        const rowBgs: string[] = [];
        const rowCells: string[] = [];
        const tableCells = row.tableCells || [];
        for (let c = 0; c < tableCells.length; c++) {
          const cell = tableCells[c];
          const bg = cell.tableCellStyle?.backgroundColor?.color?.rgbColor;
          const hexBg = bg ? getHexFromRgb(bg) : 'default';
          rowBgs.push(hexBg);

          const cellContent = cell.content || [];
          const cellText = linearizeCellContent(cellContent, listsById, listState);
          rowCells.push(cellText);
        }
        backgroundColors.push(rowBgs);
        cells.push(rowCells);
      }

      const tableMetadata = {
        rows,
        cols,
        backgroundColors,
        cells,
      };

      const linearStart = linearText.length;
      const jsonStr = JSON.stringify(tableMetadata);
      const token = `{{table:${jsonStr}}}\n`;
      linearText += token;
      const linearEnd = linearText.length;

      elementMap.push({
        type: 'table',
        linearStart: linearStart,
        linearEnd: linearEnd,
        docStart: docStart,
        docEnd: docEnd,
        parts: [
          { type: 'table', linearLen: token.length - 1, docLen: docEnd - docStart - 1 },
          { type: 'terminator', linearLen: 1, docLen: 1 }
        ]
      } as any);
    }
  }

  return {
    text: linearText,
    elementMap: elementMap,
  };
}

export function translateLinearToDocIndex(linearIndex: number, elementMap: DocElementMap[]): number {
  if (elementMap.length === 0) return 1;

  const lastDocEnd = elementMap[elementMap.length - 1].docEnd;
  let docIndex = 1;
  let found = false;

  for (let i = 0; i < elementMap.length; i++) {
    const entry = elementMap[i];
    if (linearIndex >= entry.linearStart && linearIndex <= entry.linearEnd) {
      const relIndex = linearIndex - entry.linearStart;
      const parts = (entry as any).parts || [];

      let currentLinearRel = 0;
      let currentDocRel = 0;

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        const partLinearEnd = currentLinearRel + part.linearLen;

        if (relIndex >= currentLinearRel && relIndex <= partLinearEnd) {
          if (part.type === 'prefix' || part.type === 'image' || part.type === 'table') {
            docIndex = entry.docStart + currentDocRel;
          } else {
            docIndex = entry.docStart + currentDocRel + (relIndex - currentLinearRel);
          }
          found = true;
          break;
        }

        currentLinearRel += part.linearLen;
        currentDocRel += part.docLen;
      }

      if (found) break;
      docIndex = entry.docEnd;
      found = true;
      break;
    }
  }

  if (!found) {
    const last = elementMap[elementMap.length - 1];
    if (linearIndex >= last.linearEnd) {
      docIndex = last.docEnd;
    } else {
      docIndex = elementMap[0].docStart;
    }
  }

  if (docIndex >= lastDocEnd) {
    return lastDocEnd - 1;
  }
  return docIndex;
}

export function getLinearOperations(oldText: string, newText: string): LinearOperation[] {
  const diffs = dmp.diff_main(oldText, newText, false);
  dmp.diff_cleanupSemantic(diffs);

  let linearIndex = 0;
  const ops: LinearOperation[] = [];

  for (let i = 0; i < diffs.length; i++) {
    const diff = diffs[i];
    const op = diff[0];
    const chunk = diff[1];
    if (!chunk) continue;

    if (op === DiffOp.Equal) {
      linearIndex += chunk.length;
    } else if (op === DiffOp.Delete) {
      ops.push({
        type: 'delete',
        count: chunk.length,
        ...({ linearStart: linearIndex, linearEnd: linearIndex + chunk.length } as any),
      });
      linearIndex += chunk.length;
    } else if (op === DiffOp.Insert) {
      ops.push({
        type: 'insert',
        text: chunk,
        ...({ linearStart: linearIndex } as any),
      });
    }
  }

  return ops;
}

export function getLinearOpsFromOt(operations: OtOperation[]): LinearOperation[] {
  let linearIndex = 0;
  const ops: LinearOperation[] = [];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op.type === 'retain') {
      linearIndex += op.count || 0;
    } else if (op.type === 'delete') {
      const count = op.count || 0;
      ops.push({
        type: 'delete',
        count,
        ...({ linearStart: linearIndex, linearEnd: linearIndex + count } as any),
      });
      linearIndex += count;
    } else if (op.type === 'insert') {
      ops.push({
        type: 'insert',
        text: op.text || '',
        ...({ linearStart: linearIndex } as any),
      });
    }
  }

  return ops;
}

export interface StyleRange {
  styleName: string;
  value: any;
  startIndex: number;
  endIndex: number;
}

export function parseStyleTagsAndPrefixes(inputText: string, keepTabs = false): {
  plainText: string;
  styles: StyleRange[];
  listInfo: {
    listType: 'bullet' | 'ordered' | null;
    nestingLevel: number;
    prefixLen: number;
  };
  paragraphStyles: {
    align?: 'START' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    heading?: number;
  };
} {
  let text = inputText;

  // 1. Parse paragraph style tags at the start of the text
  const paragraphStyles: {
    align?: 'START' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
    heading?: number;
  } = {};

  const paraTagRegex = /^\{\{align:(center|right|justify|left)\}\}|^\{\{heading:([0-4])\}\}/;
  let match;
  while ((match = paraTagRegex.exec(text)) !== null) {
    if (match[1]) {
      const a = match[1];
      if (a === 'center') paragraphStyles.align = 'CENTER';
      else if (a === 'right') paragraphStyles.align = 'RIGHT';
      else if (a === 'justify') paragraphStyles.align = 'JUSTIFIED';
      else if (a === 'left') paragraphStyles.align = 'START';
    } else if (match[2]) {
      paragraphStyles.heading = Number(match[2]);
    }
    text = text.substring(match[0].length);
  }

  // 2. Parse list prefix
  const listInfo = {
    listType: null as 'bullet' | 'ordered' | null,
    nestingLevel: 0,
    prefixLen: 0
  };

  const listRegex = /^(\t*)\{\{list:(bullet|ordered)\}\}/;
  const listMatch = listRegex.exec(text);
  if (listMatch) {
    listInfo.nestingLevel = listMatch[1].length;
    if (listMatch[2] === 'bullet') {
      listInfo.listType = 'bullet';
    } else if (listMatch[2] === 'ordered') {
      listInfo.listType = 'ordered';
    }
    listInfo.prefixLen = listMatch[0].length;
    text = (keepTabs ? listMatch[1] : '') + text.substring(listInfo.prefixLen);
  }

  // 3. Parse inline style tags
  const styles: StyleRange[] = [];
  const tagRegex = /\{\{([a-zA-Z]+):([^}]+)\}\}/g;
  
  let plainText = '';
  let lastIndex = 0;
  let activeStyles: Record<string, { value: any; startIndex: number }> = {};

  while ((match = tagRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    plainText += text.substring(lastIndex, matchIndex);
    
    const styleName = match[1];
    const rawVal = match[2];
    
    let value: any = rawVal;
    if (rawVal === 'true') value = true;
    else if (rawVal === 'false') value = false;
    else if (rawVal === 'default') value = 'default';
    else if (!isNaN(Number(rawVal))) value = Number(rawVal);

    const currentOffset = plainText.length;
    
    if (activeStyles[styleName]) {
      const active = activeStyles[styleName];
      if (currentOffset > active.startIndex) {
        styles.push({
          styleName,
          value: active.value,
          startIndex: active.startIndex,
          endIndex: currentOffset
        });
      }
      delete activeStyles[styleName];
    }
    
    if (value !== 'default' && value !== false) {
      activeStyles[styleName] = {
        value,
        startIndex: currentOffset
      };
    }
    
    lastIndex = tagRegex.lastIndex;
  }
  
  plainText += text.substring(lastIndex);
  
  const currentOffset = plainText.length;
  for (const styleName in activeStyles) {
    const active = activeStyles[styleName];
    if (currentOffset > active.startIndex) {
      styles.push({
        styleName,
        value: active.value,
        startIndex: active.startIndex,
        endIndex: currentOffset
      });
    }
  }

  return {
    plainText,
    styles,
    listInfo,
    paragraphStyles
  };
}

export function stripStyleTags(text: string): string {
  return text.replace(/\{\{[a-zA-Z]+:[^}]+\}\}/g, '');
}

export function processInsertionText(text: string, tabId: string | null, inlineObjects: any): any[] {
  let cleanText = text.replace(/\uFFFC\[table:\d+\]\n?/g, '[Table]\n');

  const imageRegex = /\uFFFC\[image:([^\s\]]+)(?:\ssrc="([^"]*)")?\]/g;
  let match;
  const parts: any[] = [];
  let lastIndex = 0;

  while ((match = imageRegex.exec(cleanText)) !== null) {
    const matchIndex = match.index;
    const objectId = match[1];
    const src = match[2] || '';

    if (matchIndex > lastIndex) {
      parts.push({
        type: 'text',
        text: cleanText.substring(lastIndex, matchIndex),
      });
    }

    parts.push({
      type: 'image',
      objectId: objectId,
      src: src,
    });

    lastIndex = imageRegex.lastIndex;
  }

  if (lastIndex < cleanText.length) {
    parts.push({
      type: 'text',
      text: cleanText.substring(lastIndex),
    });
  }

  return parts;
}

export function translateOpsToDocOps(
  linearOps: LinearOperation[],
  elementMap: DocElementMap[],
  tabId: string | null,
  inlineObjects: any
): any[] {
  const docOps: any[] = [];
  for (let i = 0; i < linearOps.length; i++) {
    const op = linearOps[i] as any;
    if (op.type === 'delete') {
      const docStart = translateLinearToDocIndex(op.linearStart, elementMap);
      const docEnd = translateLinearToDocIndex(op.linearEnd, elementMap);
      if (docEnd > docStart) {
        docOps.push({
          type: 'delete',
          startIndex: docStart,
          endIndex: docEnd,
        });
      }
    } else if (op.type === 'insert') {
      const docIndex = translateLinearToDocIndex(op.linearStart, elementMap);
      let textToSplit = op.text || '';
      if (textToSplit.endsWith('\n')) {
        textToSplit = textToSplit.slice(0, -1);
      }
      const lines = textToSplit.split('\n');
      
      let currentOffset = 0;
      const cleanLines: string[] = [];

      for (let j = 0; j < lines.length; j++) {
        const line = lines[j];
        if (line.startsWith('{{table:') && line.endsWith('}}')) {
          try {
            const jsonStr = line.substring(8, line.length - 2);
            const metadata = JSON.parse(jsonStr);
            docOps.push({
              type: 'insert_table',
              index: docIndex + currentOffset,
              rows: metadata.rows,
              cols: metadata.cols,
              backgroundColors: metadata.backgroundColors,
              cells: metadata.cells,
            });
            // Placeholder takes 1 character (newline)
            currentOffset += 1;
            cleanLines.push(''); // will become empty paragraph when joined with \n
          } catch (e) {
            console.error('Failed to parse table JSON in insertion:', e);
            cleanLines.push(line);
            const parsed = parseStyleTagsAndPrefixes(line, true);
            currentOffset += parsed.plainText.length + 1;
          }
        } else {
          cleanLines.push(line);
          const parsed = parseStyleTagsAndPrefixes(line, true);
          currentOffset += parsed.plainText.length + 1;
        }
      }

      // Join the clean lines to insert as a single text block
      const plainTextToInsert = cleanLines.map((line: string) => parseStyleTagsAndPrefixes(line, true).plainText).join('\n');
      
      const parts = processInsertionText(plainTextToInsert, tabId, inlineObjects);
      let textOffset = 0;

      for (let j = 0; j < parts.length; j++) {
        const part = parts[j];
        if (part.type === 'text') {
          docOps.push({
            type: 'insert_text',
            index: docIndex + textOffset,
            text: part.text,
          });
          textOffset += part.text.length;
        } else if (part.type === 'image') {
          docOps.push({
            type: 'insert_image',
            index: docIndex + textOffset,
            objectId: part.objectId,
            src: part.src,
          });
          textOffset += 1;
        }
      }
    }
  }
  return docOps;
}

export function parseUnifiedHunks(patchText: string): any[] {
  const lines = String(patchText).split(/\r?\n/);
  const hunks: any[] = [];
  let i = 0;

  while (i < lines.length) {
    const header = lines[i];
    const m = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/.exec(header);
    if (!m) {
      i++;
      continue;
    }

    const oldStart = Number(m[1]);
    const oldLen = m[2] ? Number(m[2]) : 1;
    const newStart = Number(m[3]) ;
    const newLen = m[4] ? Number(m[4]) : 1;
    i++;

    const hunkLines: any[] = [];
    while (i < lines.length && !lines[i].startsWith('@@ ')) {
      const line = lines[i];
      if (line.length === 0) {
        i++;
        continue;
      }
      const tag = line.charAt(0);
      if (tag === ' ' || tag === '+' || tag === '-') {
        const encoded = line.substring(1);
        let content = encoded;
        try {
          content = decodeURI(encoded);
        } catch (_) {
          content = encoded;
        }
        hunkLines.push({ tag, content });
      }
      i++;
    }

    hunks.push({ oldStart, oldLen, newStart, newLen, lines: hunkLines });
  }

  return hunks;
}

export function applyUnifiedHunksToText(text: string, hunks: any[]): [string, boolean[]] {
  const lineData = splitTextLines(text);
  const lines = lineData.lines.slice();
  let offset = 0;
  const results: boolean[] = [];

  for (let h = 0; h < hunks.length; h++) {
    const hunk = hunks[h];
    const oldSeq = hunk.lines.filter((x: any) => x.tag !== '+').map((x: any) => x.content);
    const newSeq = hunk.lines.filter((x: any) => x.tag !== '-').map((x: any) => x.content);

    let at = Math.max(0, hunk.oldStart - 1 + offset);
    if (!linesMatchAt(lines, at, oldSeq)) {
      at = findNearbyMatch(lines, oldSeq, at, 200);
    }

    if (at < 0) {
      results.push(false);
      continue;
    }

    lines.splice(at, oldSeq.length, ...newSeq);
    offset += newSeq.length - oldSeq.length;
    results.push(true);
  }

  let text2 = lines.join('\n');
  if (lineData.trailingNewline) text2 += '\n';
  return [text2, results];
}

export function splitTextLines(text: string): { lines: string[]; trailingNewline: boolean } {
  const trailingNewline = text.endsWith('\n');
  const lines = text.split('\n');
  if (trailingNewline) lines.pop();
  return { lines, trailingNewline };
}

export function linesMatchAt(allLines: string[], index: number, seq: string[]): boolean {
  if (index < 0 || index + seq.length > allLines.length) return false;
  for (let i = 0; i < seq.length; i++) {
    if (allLines[index + i] !== seq[i]) return false;
  }
  return true;
}

export function findNearbyMatch(allLines: string[], seq: string[], hintIndex: number, windowSize: number): number {
  const start = Math.max(0, hintIndex - windowSize);
  const end = Math.min(allLines.length - seq.length, hintIndex + windowSize);
  for (let i = start; i <= end; i++) {
    if (linesMatchAt(allLines, i, seq)) return i;
  }
  return -1;
}

export function applyPatchToText(text: string, patch: string): [string, any, boolean[]] {
  const patches = dmp.patch_fromText(patch);
  const result = dmp.patch_apply(patches, text);
  return [result[0], patches, result[1]];
}

export function applyOtToText(text: string, operations: OtOperation[]): string {
  let result = '';
  let cursor = 0;
  for (const op of operations) {
    if (op.type === 'retain') {
      const count = op.count || 0;
      result += text.substring(cursor, cursor + count);
      cursor += count;
    } else if (op.type === 'delete') {
      cursor += op.count || 0;
    } else if (op.type === 'insert') {
      result += op.text || '';
    }
  }
  return result;
}

