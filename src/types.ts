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
