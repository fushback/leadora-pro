/**
 * Formats a phone number into standard WhatsApp format with country code.
 * Defaults to +91 for 10-digit Indian numbers if no country code provided.
 */
export function formatWhatsAppNumber(phone: string, country = 'India'): string {
  if (!phone) return '';
  
  // Extract all digits and any leading '+'
  const cleaned = phone.trim();
  const digitsOnly = cleaned.replace(/\D/g, '');
  
  if (!digitsOnly) return '';

  // If already starts with '+' or international prefix
  if (cleaned.startsWith('+')) {
    return '+' + digitsOnly;
  }

  // Handle Indian mobile numbers (10 digits starting with 6, 7, 8, 9)
  if (digitsOnly.length === 10 && (country.toLowerCase() === 'india' || country.toLowerCase() === 'in')) {
    return '+91' + digitsOnly;
  }

  // If 11 digits starting with 0 (e.g. 098320...) in India
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0') && country.toLowerCase() === 'india') {
    return '+91' + digitsOnly.slice(1);
  }

  // If 12 digits starting with 91
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return '+' + digitsOnly;
  }

  // If 11 digits starting with 1 (USA/Canada)
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return '+' + digitsOnly;
  }

  return digitsOnly.length >= 7 ? '+' + digitsOnly : '';
}

/**
 * Validates whether a lead has an actual callable phone number
 */
export function hasValidPhone(phone?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Extracts a 6-digit Indian PIN code or general 5-6 digit postal code from address string
 */
export function extractPincode(address: string): string {
  if (!address) return '';
  // Match 6 digits surrounded by word boundaries or space (standard PIN in India: 734001, 110001 etc.)
  const pinMatch = address.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) return pinMatch[1];

  // Fallback to 5-digit US zip code
  const zipMatch = address.match(/\b([0-9]{5})\b/);
  if (zipMatch) return zipMatch[1];

  return '';
}

/**
 * Safely slugifies a string for file names
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_')
    .slice(0, 50);
}

/**
 * Validates whether a URL is an authentic, specific account/page/channel/storefront URL
 * and not merely a platform homepage, generic landing page, sign-in/login link, or search URL.
 */
export function isAuthenticPlatformProfileUrl(platform: string, rawUrl?: string | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const url = rawUrl.trim();
  if (url.length < 15 || !url.startsWith('http')) return false;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const pathname = parsed.pathname.trim().replace(/\/+$/, ''); // strip trailing slash

    // Common non-profile/generic pages across all platforms
    const genericForbiddenPaths = [
      '',
      '/',
      '/login',
      '/signin',
      '/signup',
      '/register',
      '/join',
      '/home',
      '/feed',
      '/explore',
      '/search',
      '/about',
      '/help',
      '/privacy',
      '/terms',
      '/contact'
    ];

    if (genericForbiddenPaths.includes(pathname.toLowerCase())) {
      return false;
    }

    // Path segments without empty items
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return false;

    switch (platform) {
      case 'linkedin': {
        if (!host.includes('linkedin.com')) return false;
        // Valid forms: /company/{name}, /in/{handle}, /school/{name}
        if (segments[0] === 'company' && segments.length >= 2 && segments[1].length >= 2) return true;
        if (segments[0] === 'in' && segments.length >= 2 && segments[1].length >= 2) return true;
        if (segments[0] === 'school' && segments.length >= 2 && segments[1].length >= 2) return true;
        return false;
      }
      case 'instagram': {
        if (!host.includes('instagram.com')) return false;
        // Exclude system, explore, media, auth, directory, and search pages
        const nonProfileIg = new Set([
          'accounts', 'explore', 'reels', 'stories', 'direct', 'about', 
          'legal', 'developer', 'p', 'reel', 'tv', 'share', 'tags', 'directory', 
          'emails', 'download', 'ar', 'api', 'help', 'support', 'privacy', 'terms',
          'press', 'blog', 'creators', 'business', 'settings', 'login', 'logout'
        ]);
        if (segments.length === 1) {
          const handle = segments[0].toLowerCase();
          if (
            !nonProfileIg.has(handle) &&
            !handle.endsWith('.php') &&
            !handle.endsWith('.html') &&
            !handle.startsWith('.') &&
            !handle.endsWith('.') &&
            !handle.includes('..') &&
            /^[a-zA-Z0-9._]{3,30}$/.test(handle)
          ) {
            return true;
          }
        }
        // Account sub-views like instagram.com/{username}/reels or /tagged
        if (segments.length === 2 && ['reels', 'channel', 'tagged'].includes(segments[1].toLowerCase())) {
          const handle = segments[0].toLowerCase();
          if (
            !nonProfileIg.has(handle) &&
            !handle.endsWith('.php') &&
            !handle.endsWith('.html') &&
            !handle.startsWith('.') &&
            !handle.endsWith('.') &&
            !handle.includes('..') &&
            /^[a-zA-Z0-9._]{3,30}$/.test(handle)
          ) {
            return true;
          }
        }
        return false;
      }
      case 'facebook': {
        if (!host.includes('facebook.com') && !host.includes('fb.me') && !host.includes('fb.com')) return false;
        // Exclude redirection links or link shims
        if (host.startsWith('l.') || host.startsWith('lm.') || pathname === '/l.php' || pathname.startsWith('/l.php')) return false;
        const nonProfileFb = new Set([
          'login', 'logout', 'pages', 'groups', 'group', 'watch', 'marketplace', 'gaming', 'events', 'event', 
          'bookmarks', 'policies', 'help', 'recover', 'share', 'sharer', 'dialog', 
          'hashtag', 'photo', 'photos', 'video', 'videos', 'story', 'stories', 'ads',
          'business', 'privacy', 'legal', 'support', 'about', 'search', 'home', 'feed',
          'permalink', 'campaign', 'settings', 'notifications', 'messages', 'connect',
          'plugins', 'tr', 'checkpoint'
        ]);
        // Direct page/profile username: facebook.com/{pageOrUsername} (min 3 characters)
        if (segments.length === 1) {
          const pageHandle = segments[0].toLowerCase();
          if (
            !nonProfileFb.has(pageHandle) &&
            !pageHandle.endsWith('.php') &&
            !pageHandle.endsWith('.html') &&
            /^[a-zA-Z0-9.-]{3,60}$/.test(pageHandle)
          ) {
            return true;
          }
        }
        // Specific verified page/profile formats
        if (segments[0] === 'p' && segments.length >= 2 && segments[1].length >= 3) return true;
        if (segments[0] === 'people' && segments.length >= 2 && segments[1].length >= 3) return true;
        if (segments[0] === 'pages' && segments.length >= 3) return true;
        // Profile ID format: facebook.com/profile.php?id=1000...
        if (pathname === '/profile.php' && parsed.searchParams.has('id')) {
          const idVal = parsed.searchParams.get('id') || '';
          return /^\d{4,}$/.test(idVal);
        }
        return false;
      }
      case 'twitter': {
        if (!host.includes('twitter.com') && !host.includes('x.com')) return false;
        const nonProfileTw = ['home', 'explore', 'notifications', 'messages', 'i', 'settings', 'search', 'tos', 'privacy'];
        if (segments.length === 1 && !nonProfileTw.includes(segments[0].toLowerCase()) && segments[0].length >= 2) {
          return true;
        }
        return false;
      }
      case 'youtube': {
        if (!host.includes('youtube.com') && !host.includes('youtu.be')) return false;
        // Valid forms: /@channelHandle, /c/ChannelName, /channel/UC..., /user/UserName
        if (segments[0]?.startsWith('@') && segments[0].length >= 3) return true;
        if ((segments[0] === 'c' || segments[0] === 'channel' || segments[0] === 'user') && segments.length >= 2) return true;
        return false;
      }
      case 'indiamart': {
        if (!host.includes('indiamart.com')) return false;
        // e.g., companyname.indiamart.com or indiamart.com/companyname
        if (host.endsWith('.indiamart.com') && host !== 'indiamart.com' && host !== 'm.indiamart.com' && host !== 'dir.indiamart.com') {
          return true;
        }
        if (segments.length === 1 && !['city', 'search', 'catalog', 'enquiry'].includes(segments[0].toLowerCase())) {
          return true;
        }
        return false;
      }
      case 'tradeindia': {
        if (!host.includes('tradeindia.com')) return false;
        // e.g., Seller profile on tradeindia.com/Seller-Name/ or subdomain
        if (host.endsWith('.tradeindia.com') && host !== 'tradeindia.com' && host !== 'www.tradeindia.com') return true;
        if (segments.length >= 1 && !['Seller', 'buyers', 'products', 'manufacturers'].includes(segments[0])) return true;
        return false;
      }
      case 'justdial': {
        if (!host.includes('justdial.com')) return false;
        // e.g. justdial.com/City/Business-Name/0353P...
        if (segments.length >= 2) return true;
        return false;
      }
      case 'amazon': {
        if (!host.includes('amazon.in') && !host.includes('amazon.com')) return false;
        // Storefront e.g. /stores/BrandName or /sp?seller=...
        if (segments[0] === 'stores' && segments.length >= 2) return true;
        if (parsed.searchParams.has('seller') || parsed.searchParams.has('me')) return true;
        return false;
      }
      case 'flipkart': {
        if (!host.includes('flipkart.com')) return false;
        // e.g. flipkart.com/seller/...
        if (segments[0] === 'seller' || parsed.searchParams.has('sellerId')) return true;
        return false;
      }
      case 'meesho': {
        if (!host.includes('meesho.com')) return false;
        // e.g. meesho.com/supplier/...
        if (segments[0] === 'supplier' || segments[0] === 'store') return true;
        return false;
      }
      default: {
        return segments.length >= 1 && segments[0].length >= 3;
      }
    }
  } catch (e) {
    return false;
  }
}
