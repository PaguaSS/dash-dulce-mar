import api from './api';

const WEB_MNGMT_BASE = '/web-mngmt';

// Types matching the backend entities
export interface HeroButton {
  key: string;
  href: string;
  variant: 'primary' | 'outline';
}

export interface HeroContent {
  videoUrl: string | null;
  backgroundImage: string;
  heroImage: string;
  buttons: HeroButton[];
}

export interface UploadVideoResponse {
  url: string;
}

export interface UploadImageResponse {
  url: string;
}

export interface CakeItem {
  id: string;
  imageUrl: string;
}

export interface TopCakesContent {
  cakes: CakeItem[];
}

export interface FooterLink {
  key: string;
  href: string;
  isExternal: boolean;
}

export interface FooterColumn {
  key: string;
  links: FooterLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface FooterContent {
  columns: FooterColumn[];
  socialLinks: SocialLink[];
}

export interface AboutUsSection {
  id: string;
  anchor: string;
  imageUrl: string | null;
  imageAlignment: 'left' | 'right';
}

export interface SiteContent {
  hero: HeroContent;
  topCakes: TopCakesContent;
  footer: FooterContent;
  aboutUs: AboutUsSection[];
}

export type TranslationData = Record<string, unknown>;

export interface AllTranslations {
  es: TranslationData;
  en: TranslationData;
}

export const webMngmtService = {
  // Content endpoints
  getAllContent: async (): Promise<SiteContent> => {
    const response = await api.get<SiteContent>(`${WEB_MNGMT_BASE}/content`);
    return response.data;
  },

  getContentBySection: async <T>(section: string): Promise<T> => {
    const response = await api.get<T>(`${WEB_MNGMT_BASE}/content/${section}`);
    return response.data;
  },

  updateContentBySection: async <T>(section: string, data: T): Promise<T> => {
    const response = await api.put<T>(`${WEB_MNGMT_BASE}/content/${section}`, data);
    return response.data;
  },

  // Translation endpoints
  getAllTranslations: async (): Promise<AllTranslations> => {
    const response = await api.get<AllTranslations>(`${WEB_MNGMT_BASE}/translations`);
    return response.data;
  },

  getTranslationByLanguage: async (lang: 'es' | 'en'): Promise<TranslationData> => {
    const response = await api.get<TranslationData>(`${WEB_MNGMT_BASE}/translations/${lang}`);
    return response.data;
  },

  updateTranslationByLanguage: async (lang: 'es' | 'en', data: TranslationData): Promise<TranslationData> => {
    const response = await api.put<TranslationData>(`${WEB_MNGMT_BASE}/translations/${lang}`, data);
    return response.data;
  },

  // Generic image upload endpoint
  uploadGenericImage: async (image: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('image', image);
    const response = await api.post<UploadImageResponse>(`${WEB_MNGMT_BASE}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // Video upload endpoint
  uploadHeroVideo: async (video: File): Promise<UploadVideoResponse> => {
    const formData = new FormData();
    formData.append('video', video);
    const response = await api.post<UploadVideoResponse>(`${WEB_MNGMT_BASE}/hero/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteHeroVideo: async (): Promise<void> => {
    await api.delete(`${WEB_MNGMT_BASE}/hero/video`);
  },

  // Image upload endpoint
  uploadHeroImage: async (image: File): Promise<UploadImageResponse> => {
    const formData = new FormData();
    formData.append('image', image);
    const response = await api.post<UploadImageResponse>(`${WEB_MNGMT_BASE}/hero/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteHeroImage: async (): Promise<void> => {
    await api.delete(`${WEB_MNGMT_BASE}/hero/image`);
  },
};
