import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "./apiClient";
import type { AgeGroup, ContentItem, AgeCategory } from "@/data/staticData";
import { AGE_CATEGORIES } from "@/data/staticData";

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
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [ageCategories, setAgeCategories] = useState<AgeCategory[]>(AGE_CATEGORIES);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshContent = useCallback(async () => {
    try {
      const response = await apiClient.get('content');
      setAllContent(response.data);
    } catch (error) {
      // Error handling suppressed; content will be empty
    }
  }, []);

  const refreshAgeCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('age-categories');
      if (response.data && response.data.length > 0) {
        setAgeCategories(response.data);
      } else {
        setAgeCategories(AGE_CATEGORIES);
      }
    } catch (error) {
      setAgeCategories(AGE_CATEGORIES);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([refreshContent(), refreshAgeCategories()]);
      setIsLoaded(true);
    };
    loadData();
  }, [refreshContent, refreshAgeCategories]);

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
        console.error("Add content error:", error.response?.data || error.message);
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
        console.error("Edit content error:", error.response?.data || error.message);
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
        console.error("Edit category error:", error.response?.data || error.message);
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
