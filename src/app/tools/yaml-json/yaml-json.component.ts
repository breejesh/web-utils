import { Component, Input, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { dump as yamlDump, load as yamlLoad } from 'js-yaml';
import { ToolDefinition } from '../../core/models/tool.model';
import { ClipboardService } from '../../core/services/clipboard.service';
import { ToolLayoutComponent } from '../../shared/components/tool-layout/tool-layout.component';
import { ToolHistoryDirective } from '../../shared/directives/tool-history.directive';

@Component({
  selector: 'app-yaml-json',
  standalone: true,
  imports: [FormsModule, ToolLayoutComponent, ToolHistoryDirective],
  template: `
    <app-tool-layout [tool]="tool">
      <div class="toolbar">
        <button type="button" class="btn btn-primary" (click)="yamlToJson()">YAML → JSON</button>
        <button type="button" class="btn btn-primary" (click)="jsonToYaml()">JSON → YAML</button>
        <button type="button" class="btn btn-ghost" (click)="sample()">Sample</button>
        <button type="button" class="btn btn-danger" (click)="clear()">Clear</button>
      </div>
      @if (error) { <div class="error-box">{{ error }}</div> }
      <div class="workspace-fill grid-2">
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">YAML</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(yaml)">Copy</button>
          </div>
          <textarea class="textarea fill" [(ngModel)]="yaml" [appToolHistory]="tool.slug" historyField="yaml" placeholder="key: value"></textarea>
        </div>
        <div class="panel surface workspace-pane">
          <div class="panel-head">
            <h3 class="panel-title">JSON</h3>
            <button type="button" class="btn btn-ghost btn-sm" (click)="clip.copy(json)">Copy</button>
          </div>
          <textarea class="textarea fill" [(ngModel)]="json" [appToolHistory]="tool.slug" historyField="json" placeholder='{"key":"value"}'></textarea>
        </div>
      </div>
    </app-tool-layout>
  `,
})
export class YamlJsonComponent {
  @Input({ required: true }) tool!: ToolDefinition;
  readonly clip = inject(ClipboardService);
  yaml = '';
  json = '';
  error = '';

  yamlToJson(): void {
    this.error = '';
    try {
      const data = yamlLoad(this.yaml);
      this.json = JSON.stringify(data, null, 2);
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Invalid YAML';
    }
  }

  jsonToYaml(): void {
    this.error = '';
    try {
      const data = JSON.parse(this.json);
      this.yaml = yamlDump(data, { lineWidth: 100, noRefs: true });
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Invalid JSON';
    }
  }

  sample(): void {
    this.yaml = `site: Web Utils\nfeatures:\n  - privacy\n  - ssr\ntheme:\n  accent: "#64ffda"\n`;
    this.yamlToJson();
  }

  clear(): void {
    this.yaml = this.json = this.error = '';
  }
}
