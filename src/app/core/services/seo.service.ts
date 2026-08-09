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
  noIndex?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  setHome(): void {
    this.apply({
      title: `${environment.siteName} — Client-Side Developer & Everyday Tools`,
      description:
        'Free privacy-first web utilities that run entirely in your browser: Base64, JSON, JWT, hash, QR, converters, and more. Nothing is uploaded.',
      path: '/',
      keywords: ['online tools', 'client side tools', 'base64', 'json formatter', 'jwt decoder', 'privacy tools'],
    });
  }

  setTool(tool: ToolDefinition): void {
    this.apply({
      title: `${tool.seoTitle} | ${environment.siteName}`,
      description: tool.seoDescription,
      path: `/tools/${tool.slug}`,
      keywords: tool.keywords,
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.name,
      description: tool.seoDescription,
      url: `${environment.siteUrl}/tools/${tool.slug}`,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      browserRequirements: 'Requires JavaScript. Runs fully client-side.',
    });
  }

  setPrivacy(): void {
    this.apply({
      title: `Privacy | ${environment.siteName}`,
      description:
        'Web Utils processes your inputs entirely in the browser. Learn what we collect (page analytics only) and what we never see.',
      path: '/privacy',
    });
  }

  setNotFound(): void {
    this.apply({
      title: `Page not found | ${environment.siteName}`,
      description: 'The page you requested does not exist.',
      path: '/404',
      noIndex: true,
    });
  }

  private apply(input: SeoInput): void {
    const url = this.absoluteUrl(input.path || '/');
    this.title.setTitle(input.title);
    this.meta.updateTag({ name: 'description', content: input.description });
    this.meta.updateTag({
      name: 'robots',
      content: input.noIndex ? 'noindex, nofollow' : 'index, follow',
    });
    if (input.keywords?.length) {
      this.meta.updateTag({ name: 'keywords', content: input.keywords.join(', ') });
    }
    this.meta.updateTag({ property: 'og:title', content: input.title });
    this.meta.updateTag({ property: 'og:description', content: input.description });
    this.meta.updateTag({ property: 'og:type', content: input.type || 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:site_name', content: environment.siteName });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: input.title });
    this.meta.updateTag({ name: 'twitter:description', content: input.description });
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
    const id = 'tool-jsonld';
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
