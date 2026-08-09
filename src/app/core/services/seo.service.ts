import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { ToolDefinition } from '../models/tool.model';

export interface SeoInput {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: string;
  image?: string;
  noIndex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly defaultOgImage = `${environment.siteUrl}/doc-images/homepage-dark.png`;

  setHome(): void {
    this.apply({
      title: `${environment.siteName} — Privacy-First Client-Side Developer Tools`,
      description:
        'Free, privacy-first web utilities running 100% in your browser: Base64, JSON Formatter, JWT Debugger, EVTX Viewer, Regex Tester, Unix Timestamp Converter, Hash Generator, and more. Zero server uploads.',
      path: '/',
      keywords: [
        'web utils',
        'developer tools',
        'client-side utilities',
        'privacy first web tools',
        'base64 encode decode',
        'json formatter online',
        'jwt debugger',
        'evtx log viewer',
        'regex tester online',
        'unix epoch converter',
        'breejesh rathod',
      ],
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${environment.siteUrl}/#website`,
          url: `${environment.siteUrl}/`,
          name: environment.siteName,
          description: 'Privacy-first, client-side utility suite for everyday developer & life tasks.',
          publisher: {
            '@type': 'Person',
            name: 'Breejesh Rathod',
            url: 'https://breejeshrathod.com',
          },
        },
        {
          '@type': 'SoftwareApplication',
          name: environment.siteName,
          operatingSystem: 'Any',
          applicationCategory: 'DeveloperApplication',
          url: `${environment.siteUrl}/`,
          author: {
            '@type': 'Person',
            name: 'Breejesh Rathod',
            url: 'https://breejeshrathod.com',
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
      ],
    });
  }

  setTool(tool: ToolDefinition): void {
    const toolUrl = `${environment.siteUrl}/tools/${tool.slug}`;

    this.apply({
      title: `${tool.seoTitle} | ${environment.siteName}`,
      description: tool.seoDescription,
      path: `/tools/${tool.slug}`,
      keywords: tool.keywords,
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebApplication',
          name: tool.name,
          description: tool.seoDescription,
          url: toolUrl,
          applicationCategory: 'UtilitiesApplication',
          operatingSystem: 'Any',
          author: {
            '@type': 'Person',
            name: 'Breejesh Rathod',
            url: 'https://breejeshrathod.com',
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
          browserRequirements: 'Requires JavaScript. Runs 100% client-side.',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: `${environment.siteUrl}/`,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: tool.name,
              item: toolUrl,
            },
          ],
        },
      ],
    });
  }

  setPrivacy(): void {
    this.apply({
      title: `Privacy Policy | ${environment.siteName}`,
      description:
        'Web Utils processes all tool payloads entirely in your browser tab. Read our strict 100% client-side privacy and data processing guarantees.',
      path: '/privacy',
    });
  }

  setNotFound(): void {
    this.apply({
      title: `404 - Page Not Found | ${environment.siteName}`,
      description: 'The requested web utility page could not be found.',
      path: '/404',
      noIndex: true,
    });
  }

  private apply(input: SeoInput): void {
    const url = this.absoluteUrl(input.path || '/');
    const imageUrl = input.image || this.defaultOgImage;

    this.title.setTitle(input.title);
    this.meta.updateTag({ name: 'description', content: input.description });
    this.meta.updateTag({ name: 'author', content: 'Breejesh Rathod' });
    this.meta.updateTag({
      name: 'robots',
      content: input.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    });

    if (input.keywords?.length) {
      this.meta.updateTag({ name: 'keywords', content: input.keywords.join(', ') });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: input.title });
    this.meta.updateTag({ property: 'og:description', content: input.description });
    this.meta.updateTag({ property: 'og:type', content: input.type || 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:site_name', content: environment.siteName });

    // Twitter Card
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: input.title });
    this.meta.updateTag({ name: 'twitter:description', content: input.description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });

    this.setCanonical(url);
  }

  private absoluteUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${environment.siteUrl.replace(/\/$/, '')}${normalized}`;
  }

  private setCanonical(url: string): void {
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(data: Record<string, unknown>): void {
    const id = 'seo-jsonld';
    let script = this.document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.id = id;
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }
}
