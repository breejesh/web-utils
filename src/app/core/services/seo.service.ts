import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { TOOLS, getCategory } from '../data/tools.registry';
import { TOOL_CONTENT } from '../data/tools.content';
import { ToolDefinition } from '../models/tool.model';

export interface SeoInput {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  type?: string;
  image?: string;
  imageAlt?: string;
  noIndex?: boolean;
}

const AUTHOR = { '@type': 'Person', '@id': 'https://breejeshrathod.com/#person', name: 'Breejesh Rathod', url: 'https://breejeshrathod.com' };

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly site = environment.siteUrl.replace(/\/$/, '');

  setHome(): void {
    const description = `${TOOLS.length} free developer tools that run 100% in your browser — JSON formatter, Base64, JWT decoder, regex tester, epoch converter, hash generator and more. No uploads, no sign-up, works offline.`;
    this.apply({
      title: `${environment.siteName} — Private Developer Tools That Never Leave Your Browser`,
      description,
      path: '/',
      image: `${this.site}/og/home.jpg`,
      imageAlt: `${environment.siteName}: ${TOOLS.length} private, offline-capable developer tools`,
      keywords: [
        'developer tools online',
        'privacy first developer tools',
        'offline developer tools',
        'client-side tools',
        'json formatter',
        'base64 decode',
        'jwt decoder',
        'regex tester',
        'epoch converter',
      ],
    });

    this.setJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebSite',
          '@id': `${this.site}/#website`,
          url: `${this.site}/`,
          name: environment.siteName,
          alternateName: ['WebUtils', 'utils.breejeshrathod.com'],
          description,
          inLanguage: 'en',
          publisher: { '@id': AUTHOR['@id'] },
        },
        AUTHOR,
        {
          '@type': 'ItemList',
          '@id': `${this.site}/#tools`,
          name: `${environment.siteName} tools`,
          numberOfItems: TOOLS.length,
          itemListElement: TOOLS.map((t, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: t.name,
            url: `${this.site}/tools/${t.slug}`,
          })),
        },
      ],
    });
  }

  setTool(tool: ToolDefinition): void {
    const toolUrl = `${this.site}/tools/${tool.slug}`;
    const content = TOOL_CONTENT[tool.slug];
    const category = getCategory(tool.category);

    this.apply({
      title: `${tool.seoTitle} | ${environment.siteName}`,
      description: tool.seoDescription,
      path: `/tools/${tool.slug}`,
      keywords: tool.keywords,
      image: `${this.site}/og/${tool.slug}.jpg`,
      imageAlt: `${tool.name} — free, private, runs in your browser`,
    });

    const graph: Record<string, unknown>[] = [
      {
        '@type': 'WebApplication',
        '@id': `${toolUrl}#app`,
        name: tool.name,
        alternateName: tool.shortName,
        description: tool.longDescription,
        url: toolUrl,
        applicationCategory: tool.category === 'dev' || tool.category === 'data' ? 'DeveloperApplication' : 'UtilitiesApplication',
        operatingSystem: 'Any (web browser)',
        browserRequirements: 'Requires JavaScript. Runs 100% client-side; works offline.',
        isAccessibleForFree: true,
        keywords: tool.keywords.join(', '),
        author: { '@id': AUTHOR['@id'] },
        isPartOf: { '@id': `${this.site}/#website` },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        ...(content ? { featureList: content.steps } : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Tools', item: `${this.site}/` },
          ...(category
            ? [{ '@type': 'ListItem', position: 2, name: category.name, item: `${this.site}/#${category.id}` }]
            : []),
          { '@type': 'ListItem', position: category ? 3 : 2, name: tool.name, item: toolUrl },
        ],
      },
    ];

    if (content?.faqs.length) {
      graph.push({
        '@type': 'FAQPage',
        '@id': `${toolUrl}#faq`,
        mainEntity: content.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      });
    }

    this.setJsonLd({ '@context': 'https://schema.org', '@graph': graph });
  }

  setPrivacy(): void {
    this.apply({
      title: `Privacy — Your Data Never Leaves Your Browser | ${environment.siteName}`,
      description:
        'How Web Utils keeps every input on your device: client-side processing, a strict Content-Security-Policy that blocks outbound requests, and local-only history you control.',
      path: '/privacy',
    });
    this.removeJsonLd();
  }

  setNotFound(): void {
    this.apply({
      title: `Page not found | ${environment.siteName}`,
      description: 'The requested page could not be found. Browse all private, in-browser developer tools.',
      path: '/404',
      noIndex: true,
    });
    this.removeJsonLd();
  }

  private apply(input: SeoInput): void {
    const url = `${this.site}${input.path?.startsWith('/') ? input.path : `/${input.path || ''}`}`;
    const imageUrl = input.image || `${this.site}/og/home.jpg`;

    this.title.setTitle(input.title);
    this.meta.updateTag({ name: 'description', content: input.description });
    this.meta.updateTag({
      name: 'robots',
      content: input.noIndex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1',
    });
    if (input.keywords?.length) {
      this.meta.updateTag({ name: 'keywords', content: input.keywords.join(', ') });
    } else {
      this.meta.removeTag('name="keywords"');
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: input.title });
    this.meta.updateTag({ property: 'og:description', content: input.description });
    this.meta.updateTag({ property: 'og:type', content: input.type || 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: imageUrl });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ property: 'og:image:type', content: 'image/jpeg' });
    this.meta.updateTag({ property: 'og:image:alt', content: input.imageAlt || input.title });

    // Twitter / X
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: input.title });
    this.meta.updateTag({ name: 'twitter:description', content: input.description });
    this.meta.updateTag({ name: 'twitter:image', content: imageUrl });
    this.meta.updateTag({ name: 'twitter:image:alt', content: input.imageAlt || input.title });

    this.setCanonical(input.noIndex ? null : url);
  }

  private setCanonical(url: string | null): void {
    let link = this.document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!url) {
      link?.remove();
      return;
    }
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
    // Escape "<" so content can never close the script element.
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  }

  private removeJsonLd(): void {
    this.document.getElementById('seo-jsonld')?.remove();
  }
}
