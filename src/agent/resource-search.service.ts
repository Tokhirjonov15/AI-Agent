import { Injectable } from '@nestjs/common';
import { Resource } from '../libs/types/chat.types';

@Injectable()
export class ResourceSearchService {
  private uniqueByUrl(items: Resource[]): Resource[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.url)) {
        return false;
      }
      seen.add(item.url);
      return true;
    });
  }

  private fallbackResources(query: string): Resource[] {
    const encoded = encodeURIComponent(query);
    return [
      {
        title: `Google News: ${query}`,
        url: `https://news.google.com/search?q=${encoded}`,
        source: 'news',
      },
      {
        title: `YouTube: ${query}`,
        url: `https://www.youtube.com/results?search_query=${encoded}`,
        source: 'youtube',
      },
      {
        title: `Medium articles: ${query}`,
        url: `https://medium.com/search?q=${encoded}`,
        source: 'article',
      },
    ];
  }

  async searchResources(query: string): Promise<Resource[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const resources: Resource[] = [];

    const serperApiKey = process.env.SERPER_API_KEY;
    if (serperApiKey) {
      try {
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': serperApiKey,
          },
          body: JSON.stringify({ q: trimmed, num: 3 }),
        });
        if (response.ok) {
          const data = await response.json();
          const organic = Array.isArray(data?.organic) ? data.organic : [];
          for (const item of organic.slice(0, 3)) {
            if (item?.title && item?.link) {
              resources.push({
                title: item.title,
                url: item.link,
                source: 'article',
              });
            }
          }
        }
      } catch {
        // Ignore provider errors and continue with others.
      }
    }

    const newsApiKey = process.env.NEWS_API_KEY;
    if (newsApiKey) {
      try {
        const url = new URL('https://newsapi.org/v2/everything');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('language', 'en');
        url.searchParams.set('sortBy', 'publishedAt');
        url.searchParams.set('pageSize', '3');

        const response = await fetch(url.toString(), {
          headers: { 'X-Api-Key': newsApiKey },
        });
        if (response.ok) {
          const data = await response.json();
          const articles = Array.isArray(data?.articles) ? data.articles : [];
          for (const article of articles.slice(0, 3)) {
            if (article?.title && article?.url) {
              resources.push({
                title: article.title,
                url: article.url,
                source: 'news',
              });
            }
          }
        }
      } catch {
        // Ignore provider errors and continue with others.
      }
    }

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    if (youtubeApiKey) {
      try {
        const url = new URL('https://www.googleapis.com/youtube/v3/search');
        url.searchParams.set('part', 'snippet');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('type', 'video');
        url.searchParams.set('maxResults', '3');
        url.searchParams.set('key', youtubeApiKey);

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          const items = Array.isArray(data?.items) ? data.items : [];
          for (const item of items.slice(0, 3)) {
            const videoId = item?.id?.videoId;
            const title = item?.snippet?.title;
            if (videoId && title) {
              resources.push({
                title,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                source: 'youtube',
              });
            }
          }
        }
      } catch {
        // Ignore provider errors and continue with fallback.
      }
    }

    const deduped = this.uniqueByUrl(resources);
    return deduped.length > 0 ? deduped.slice(0, 9) : this.fallbackResources(trimmed);
  }
}
