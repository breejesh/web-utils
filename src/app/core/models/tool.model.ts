export type ToolCategoryId =
  | 'encoding'
  | 'data'
  | 'generators'
  | 'text'
  | 'time'
  | 'media'
  | 'dev'
  | 'security';

export interface ToolCategory {
  id: ToolCategoryId;
  name: string;
  description: string;
  order: number;
}

export type ToolComponentKey =
  | 'base64'
  | 'url-encode'
  | 'json-formatter'
  | 'jwt-debugger'
  | 'uuid-generator'
  | 'hash-generator'
  | 'text-diff'
  | 'timestamp-converter'
  | 'regex-tester'
  | 'color-converter'
  | 'unit-converter'
  | 'percentage-calculator'
  | 'word-counter'
  | 'case-converter'
  | 'lorem-ipsum'
  | 'qr-code'
  | 'image-tools'
  | 'csv-json'
  | 'password-generator'
  | 'date-calculator'
  | 'markdown-preview'
  | 'svg-optimizer'
  | 'cron-explainer'
  | 'sql-formatter'
  | 'yaml-json'
  | 'certificate-inspector'
  | 'exif-viewer'
  | 'evtx-viewer';

export interface ToolDefinition {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  category: ToolCategoryId;
  component: ToolComponentKey;
  icon: string;
  featured?: boolean;
  popular?: boolean;
}
