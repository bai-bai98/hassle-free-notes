import {SiteInfo} from '../types';

/**
 * Get current tab URL and site information
 */
export async function getCurrentSiteInfo(): Promise<SiteInfo | null> {
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const [tab] = await chrome.tabs.query({active: true, currentWindow: true});

      if (tab?.url) {
        return parseSiteInfo(tab.url, tab.title);
      }
    }

    if (typeof window !== 'undefined' && window.location) {
      return parseSiteInfo(window.location.href, document.title);
    }

    return null;
  } catch (error) {
    console.error('Error getting site info:', error);
    return null;
  }
}

/**
 * Parse URL and extract site information
 */
export function parseSiteInfo(url: string, pageTitle?: string): SiteInfo {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    let siteName = hostname.replace('www.', '');

    if (pageTitle && pageTitle.length > 0 && pageTitle.length < 50) {
      siteName = pageTitle;
    } else {
      siteName = siteName.split('.')[0];
      siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
    }

    return {
      url,
      siteName,
      hostname,
    };
  } catch (error) {
    return {
      url: url || 'unknown',
      siteName: 'Uncategorized',
      hostname: 'unknown',
    };
  }
}

/**
 * Group URLs by hostname
 */
export function groupByHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (error) {
    return 'Uncategorized';
  }
}
