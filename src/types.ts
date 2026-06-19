export interface TabContext {
  tabId: string;
  title: string;
  index: number;
  content: any[];
  listsById?: any;
}

export interface DocElementMap {
  type: 'text' | 'image' | 'table' | 'prefix';
  linearStart: number;
  linearEnd: number;
  docStart: number;
  docEnd: number;
  headingLevel?: number;
  bullet?: any;
  objectId?: string;
  tableIndex?: number;
  alignment?: string;
}

export interface LinearOperation {
  type: 'retain' | 'insert' | 'delete';
  count?: number;
  text?: string;
}

export interface OtOperation {
  type: 'retain' | 'insert' | 'delete';
  count?: number;
  text?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  url: string;
  lastUpdatedMs: number;
  lastUpdatedIso: string;
}

export interface Config {
  webAppUrl?: string;
  token?: string;
  tokenExpiresAt?: number;
}

export interface TextStyleState {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string; // Hex (e.g., "#FF0000") or "default"
  fontSize?: number | 'default';
}

export interface ParagraphStyleState {
  align?: 'START' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  heading?: number; // 0 for normal, 1-4 for HEADING_1 to HEADING_4
  listType?: 'bullet' | 'ordered' | null;
  nestingLevel?: number;
}
