import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "./apiClient";
import type { AgeGroup, ContentItem, AgeCategory } from "@/data/staticData";
import { AGE_CATEGORIES } from "@/data/staticData";
import { useAuth } from "./AuthContext";

interface ContentContextValue {
  allContent: ContentItem[];
  ageCategories: AgeCategory[];
  getByAge: (ageGroup: AgeGroup) => ContentItem[];
  addContent: (item: any, file?: any) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  editContent: (id: string, updates: Partial<Omit<ContentItem, "id">>, file?: any) => Promise<{ success: boolean; error?: string }>;
  editAgeCategory: (id: string, updates: Partial<AgeCategory>, image?: any) => Promise<{ success: boolean; error?: string }>;
  isLoaded: boolean;
  refreshContent: () => Promise<void>;
  refreshAgeCategories: () => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, role } = useAuth();
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>(AGE_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshContent = useCallback(async () => {
    try {
      // Double-check token exists before making request
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('[ContentContext] No auth token found, skipping content fetch');
        setAllContent([]);
        return;
      }
      
      console.log('[ContentContext] Fetching content with auth token...');
      const response = await apiClient.get('content');
      console.log('[ContentContext] Fetched content:', response.data?.length || 0, 'items');
      setAllContent(response.data || []);
    } catch (error: any) {
      console.error('[ContentContext] Error fetching content:', error.response?.status, error.message);
      console.error('[ContentContext] Error details:', error.response?.data);
      // Set to empty array on error, but log it so we can debug
      setAllContent([]);
    }
  }, []);

  const refreshAgeCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('age-categories');
      console.log('[ContentContext] Fetched age categories:', response.data?.length || 0, 'categories');
      if (response.data && response.data.length > 0) {
        setAgeCategories(response.data);
      } else {
        setAgeCategories(AGE_CATEGORIES);
      }
    } catch (error: any) {
      console.error('[ContentContext] Error fetching age categories:', error.response?.status, error.message);
      setAgeCategories(AGE_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to be loaded
      if (!authLoaded) {
        console.log('[ContentContext] Waiting for auth to load...');
        return;
      }

      // If user is not logged in, don't try to fetch content
      if (!role) {
        console.log('[ContentContext] No user logged in, skipping content fetch');
        setIsLoaded(true);
        return;
      }

      // Additional check: verify token exists before attempting fetch
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('[ContentContext] Auth role exists but no token found. Waiting for token...');
        return;
      }

      console.log('[ContentContext] Loading content data for role:', role);
      try {
        // Add small delay to ensure token is fully persisted
        await new Promise(resolve => setTimeout(resolve, 100));
        await Promise.all([refreshContent(), refreshAgeCategories()]);
        console.log('[ContentContext] Content data loaded successfully');
      } catch (error) {
        console.error('[ContentContext] Error loading content data:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, [authLoaded, role, refreshContent, refreshAgeCategories]);

  const getByAge = useCallback(
    (ageGroup: AgeGroup) => allContent.filter((c) => c.ageGroup === ageGroup),
    [allContent]
  );

  const addContent = useCallback(
    async (item: Omit<ContentItem, "id" | "postedAt" | "isNew">, file?: any) => {
      try {
        const formData = new FormData();
        Object.entries(item).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, value as string);
          }
        });
        
        if (file) {
          formData.append('file', {
            uri: file.uri,
            name: file.name || 'upload',
            type: file.mimeType || file.type || 'application/octet-stream',
          } as any);
        }

        await apiClient.post('content', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        await refreshContent();
      } catch (error: any) {
        // Re-throw the error to be handled by the calling component
        throw error;
      }
    },
    [refreshContent]
  );

  const deleteContent = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`content/${id}`);
        await refreshContent();
      } catch (error: any) {
        throw error;
      }
    },
    [refreshContent]
  );

  const editContent = useCallback(
    async (id: string, updates: Partial<Omit<ContentItem, "id">>, file?: any): Promise<{ success: boolean; error?: string }> => {
      try {
        if (file) {
          const formData = new FormData();
          Object.entries(updates).forEach(([key, value]) => {
            formData.append(key, value as string);
          });
          formData.append('file', {
            uri: file.uri,
            name: file.name || 'upload',
            type: file.mimeType || file.type || 'application/octet-stream',
          } as any);
          
          await apiClient.patch(`content/${id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          await apiClient.patch(`content/${id}`, updates);
        }
        await refreshContent();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Guhindura isomo ntibyashobotse." };
      }
    },
    [refreshContent]
  );

  const editAgeCategory = useCallback(
    async (id: string, updates: Partial<AgeCategory>, image?: any): Promise<{ success: boolean; error?: string }> => {
      try {
        const formData = new FormData();
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, value as string);
          }
        });
        
        if (image) {
          formData.append('image', {
            uri: image.uri,
            name: image.name || 'category-image',
            type: image.mimeType || image.type || 'image/jpeg',
          } as any);
        }

        await apiClient.patch(`age-categories/${encodeURIComponent(id)}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        await refreshAgeCategories();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Guhindura ikiciro cy'umwana ntibyashobotse." };
      }
    },
    [refreshAgeCategories]
  );

  return (
    <ContentContext.Provider value={{ 
      allContent, 
      ageCategories,
      getByAge, 
      addContent, 
      deleteContent, 
      editContent, 
      editAgeCategory,
      isLoaded, 
      refreshContent,
      refreshAgeCategories
    }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
