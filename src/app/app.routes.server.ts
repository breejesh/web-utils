import { RenderMode, ServerRoute } from '@angular/ssr';
import { TOOLS } from './core/data/tools.registry';

/** Explicit static paths so every tool page is prerendered for SEO. */
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  ...TOOLS.map(
    (t): ServerRoute => ({
      path: `tools/${t.slug}`,
      renderMode: RenderMode.Prerender,
    })
  ),
  { path: '**', renderMode: RenderMode.Server },
];
