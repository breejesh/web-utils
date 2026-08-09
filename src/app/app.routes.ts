import { Routes } from '@angular/router';
import { TOOLS } from './core/data/tools.registry';
import { ShellComponent } from './layout/shell/shell.component';
import { HomeComponent } from './pages/home/home.component';

const toolRoutes: Routes = TOOLS.map((tool) => ({
  path: `tools/${tool.slug}`,
  loadComponent: () => import('./pages/tool-page/tool-page.component').then((m) => m.ToolPageComponent),
  data: { toolSlug: tool.slug },
}));

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
      {
        path: '**',
        loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
      },
    ],
  },
];
