import { Injectable } from '@angular/core';
import { Observable, of, type ObservableInput } from 'rxjs';
import {
  getAllBundledArticles,
  getBundledArticle,
  getFaqArticles,
  getDocumentationArticles,
  ARTICLES_BUNDLE,
} from '../shared/articles.bundle';

export interface Article {
  id: string;
  title: string;
  content: string;
  category?: 'faq' | 'article';
}

export interface ArticleLoadError {
  filename: string;
  error: any;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  /**
   * Get all articles from the bundled content
   * This works for both development and static site deployment
   */
  getArticles(): Observable<Article[]> {
    console.log(`[ArticleService] Loading ${ARTICLES_BUNDLE.length} articles from bundle`);
    return of(getAllBundledArticles());
  }

  /**
   * Get FAQ articles only
   */
  getFaqArticles(): Observable<Article[]> {
    console.log(`[ArticleService] Loading ${getFaqArticles().length} FAQ articles from bundle`);
    return of(getFaqArticles());
  }

  /**
   * Get documentation articles only
   */
  getDocumentationArticles(): Observable<Article[]> {
    console.log(`[ArticleService] Loading ${getDocumentationArticles().length} documentation articles from bundle`);
    return of(getDocumentationArticles());
  }

  /**
   * Get a single article by ID from the bundle
   */
  getArticleById(id: string): Observable<Article | undefined> {
    const article = getBundledArticle(id);
    if (article) {
      console.log(`[ArticleService] Found article: ${article.id}`);
      return of(article);
    }
    console.warn(`[ArticleService] Article not found: ${id}`);
    return of(undefined);
  }

  /**
   * Check if articles are loaded from bundle (always true)
   */
  isFromBundle(): boolean {
    return true;
  }
}
