import { Routes } from '@angular/router';
import { TOOLS } from './core/data/tools.registry';
import { ShellComponent } from './layout/shell/shell.component';
import { HomeComponent } from './pages/home/home.component';
import { TOOL_LOADERS } from './tools/tool-loaders';

/** Each tool route lazy-loads its own component; `tool` reaches the component input via route data binding. */
const toolRoutes: Routes = TOOLS.map((tool) => ({
  path: `tools/${tool.slug}`,
  loadComponent: TOOL_LOADERS[tool.component],
  data: { tool },
}));

const loadNotFound = () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent);

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        pathMatch: 'full',
      },
      ...toolRoutes,
      {
        path: 'tools',
        redirectTo: '',
        pathMatch: 'full',
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy.component').then((m) => m.PrivacyComponent),
      },
      // Prerendered to /404.html for static hosting; identical markup to the wildcard so hydration matches.
      { path: '404', loadComponent: loadNotFound },
      { path: '**', loadComponent: loadNotFound },
    ],
  },
];
