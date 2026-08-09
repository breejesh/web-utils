import { Type } from '@angular/core';
import { ToolComponentKey } from '../core/models/tool.model';
import { Base64Component } from './base64/base64.component';
import { UrlEncodeComponent } from './url-encode/url-encode.component';
import { JsonFormatterComponent } from './json-formatter/json-formatter.component';
import { JwtDebuggerComponent } from './jwt-debugger/jwt-debugger.component';
import { UuidGeneratorComponent } from './uuid-generator/uuid-generator.component';
import { HashGeneratorComponent } from './hash-generator/hash-generator.component';
import { TextDiffComponent } from './text-diff/text-diff.component';
import { TimestampConverterComponent } from './timestamp-converter/timestamp-converter.component';
import { RegexTesterComponent } from './regex-tester/regex-tester.component';
import { ColorConverterComponent } from './color-converter/color-converter.component';
import { UnitConverterComponent } from './unit-converter/unit-converter.component';
import { PercentageCalculatorComponent } from './percentage-calculator/percentage-calculator.component';
import { WordCounterComponent } from './word-counter/word-counter.component';
import { CaseConverterComponent } from './case-converter/case-converter.component';
import { LoremIpsumComponent } from './lorem-ipsum/lorem-ipsum.component';
import { QrCodeComponent } from './qr-code/qr-code.component';
import { ImageToolsComponent } from './image-tools/image-tools.component';
import { CsvJsonComponent } from './csv-json/csv-json.component';
import { PasswordGeneratorComponent } from './password-generator/password-generator.component';
import { DateCalculatorComponent } from './date-calculator/date-calculator.component';
import { MarkdownPreviewComponent } from './markdown-preview/markdown-preview.component';
import { SvgOptimizerComponent } from './svg-optimizer/svg-optimizer.component';
import { CronExplainerComponent } from './cron-explainer/cron-explainer.component';
import { SqlFormatterComponent } from './sql-formatter/sql-formatter.component';
import { YamlJsonComponent } from './yaml-json/yaml-json.component';
import { CertificateInspectorComponent } from './certificate-inspector/certificate-inspector.component';
import { ExifViewerComponent } from './exif-viewer/exif-viewer.component';
import { EvtxViewerComponent } from './evtx-viewer/evtx-viewer.component';

export const TOOL_COMPONENT_MAP: Record<ToolComponentKey, Type<unknown>> = {
  base64: Base64Component,
  'url-encode': UrlEncodeComponent,
  'json-formatter': JsonFormatterComponent,
  'jwt-debugger': JwtDebuggerComponent,
  'uuid-generator': UuidGeneratorComponent,
  'hash-generator': HashGeneratorComponent,
  'text-diff': TextDiffComponent,
  'timestamp-converter': TimestampConverterComponent,
  'regex-tester': RegexTesterComponent,
  'color-converter': ColorConverterComponent,
  'unit-converter': UnitConverterComponent,
  'percentage-calculator': PercentageCalculatorComponent,
  'word-counter': WordCounterComponent,
  'case-converter': CaseConverterComponent,
  'lorem-ipsum': LoremIpsumComponent,
  'qr-code': QrCodeComponent,
  'image-tools': ImageToolsComponent,
  'csv-json': CsvJsonComponent,
  'password-generator': PasswordGeneratorComponent,
  'date-calculator': DateCalculatorComponent,
  'markdown-preview': MarkdownPreviewComponent,
  'svg-optimizer': SvgOptimizerComponent,
  'cron-explainer': CronExplainerComponent,
  'sql-formatter': SqlFormatterComponent,
  'yaml-json': YamlJsonComponent,
  'certificate-inspector': CertificateInspectorComponent,
  'exif-viewer': ExifViewerComponent,
  'evtx-viewer': EvtxViewerComponent,
};
