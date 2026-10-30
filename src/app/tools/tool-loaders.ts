import { Type } from '@angular/core';
import { ToolComponentKey } from '../core/models/tool.model';

/** One lazy chunk per tool so each page only downloads its own code and libraries. */
export const TOOL_LOADERS: Record<ToolComponentKey, () => Promise<Type<unknown>>> = {
  base64: () => import('./base64/base64.component').then((m) => m.Base64Component),
  'url-encode': () => import('./url-encode/url-encode.component').then((m) => m.UrlEncodeComponent),
  'json-formatter': () => import('./json-formatter/json-formatter.component').then((m) => m.JsonFormatterComponent),
  'jwt-debugger': () => import('./jwt-debugger/jwt-debugger.component').then((m) => m.JwtDebuggerComponent),
  'uuid-generator': () => import('./uuid-generator/uuid-generator.component').then((m) => m.UuidGeneratorComponent),
  'hash-generator': () => import('./hash-generator/hash-generator.component').then((m) => m.HashGeneratorComponent),
  'text-diff': () => import('./text-diff/text-diff.component').then((m) => m.TextDiffComponent),
  'timestamp-converter': () => import('./timestamp-converter/timestamp-converter.component').then((m) => m.TimestampConverterComponent),
  'regex-tester': () => import('./regex-tester/regex-tester.component').then((m) => m.RegexTesterComponent),
  'color-converter': () => import('./color-converter/color-converter.component').then((m) => m.ColorConverterComponent),
  'unit-converter': () => import('./unit-converter/unit-converter.component').then((m) => m.UnitConverterComponent),
  'percentage-calculator': () => import('./percentage-calculator/percentage-calculator.component').then((m) => m.PercentageCalculatorComponent),
  'word-counter': () => import('./word-counter/word-counter.component').then((m) => m.WordCounterComponent),
  'case-converter': () => import('./case-converter/case-converter.component').then((m) => m.CaseConverterComponent),
  'lorem-ipsum': () => import('./lorem-ipsum/lorem-ipsum.component').then((m) => m.LoremIpsumComponent),
  'qr-code': () => import('./qr-code/qr-code.component').then((m) => m.QrCodeComponent),
  'image-tools': () => import('./image-tools/image-tools.component').then((m) => m.ImageToolsComponent),
  'csv-json': () => import('./csv-json/csv-json.component').then((m) => m.CsvJsonComponent),
  'password-generator': () => import('./password-generator/password-generator.component').then((m) => m.PasswordGeneratorComponent),
  'date-calculator': () => import('./date-calculator/date-calculator.component').then((m) => m.DateCalculatorComponent),
  'markdown-preview': () => import('./markdown-preview/markdown-preview.component').then((m) => m.MarkdownPreviewComponent),
  'svg-optimizer': () => import('./svg-optimizer/svg-optimizer.component').then((m) => m.SvgOptimizerComponent),
  'cron-explainer': () => import('./cron-explainer/cron-explainer.component').then((m) => m.CronExplainerComponent),
  'sql-formatter': () => import('./sql-formatter/sql-formatter.component').then((m) => m.SqlFormatterComponent),
  'yaml-json': () => import('./yaml-json/yaml-json.component').then((m) => m.YamlJsonComponent),
  'certificate-inspector': () => import('./certificate-inspector/certificate-inspector.component').then((m) => m.CertificateInspectorComponent),
  'exif-viewer': () => import('./exif-viewer/exif-viewer.component').then((m) => m.ExifViewerComponent),
  'evtx-viewer': () => import('./evtx-viewer/evtx-viewer.component').then((m) => m.EvtxViewerComponent),
};
