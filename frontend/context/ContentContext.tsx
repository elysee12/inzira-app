import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "./apiClient";
import type { AgeGroup, ContentItem } from "@/data/staticData";

interface ContentContextValue {
  allContent: ContentItem[];
  getByAge: (ageGroup: AgeGroup) => ContentItem[];
  addContent: (item: any, file?: any) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  editContent: (id: string, updates: Partial<Omit<ContentItem, "id">>, file?: any) => Promise<{ success: boolean; error?: string }>;
  isLoaded: boolean;
  refreshContent: () => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const [allContent, setAllContent] = useState<ContentItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshContent = useCallback(async () => {
    try {
      const response = await apiClient.get('/content');
      setAllContent(response.data);
    } catch (error) {
      // Error handling suppressed; content will be empty
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshContent();
  }, [refreshContent]);

  const getByAge = useCallback(
    (ageGroup: AgeGroup) => allContent.filter((c) => c.ageGroup === ageGroup),
    [allContent]
  );

  const addContent = useCallback(
    async (item: Omit<ContentItem, "id" | "postedAt" | "isNew">, file?: any) => {
      try {
        const formData = new FormData();
        Object.entries(item).forEach(([key, value]) => {
          formData.append(key, value as string);
        });
        
        if (file) {
          formData.append('file', {
            uri: file.uri,
            name: file.name || 'upload',
            type: file.mimeType || 'application/octet-stream',
          } as any);
        }

        await apiClient.post('/content', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        await refreshContent();
      } catch (error) {
        throw error;
      }
    },
    [refreshContent]
  );

  const deleteContent = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/content/${id}`);
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
            type: file.mimeType || 'application/octet-stream',
          } as any);
          
          await apiClient.patch(`/content/${id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } else {
          await apiClient.patch(`/content/${id}`, updates);
        }
        await refreshContent();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || "Guhindura isomo ntibyashobotse." };
      }
    },
    [refreshContent]
  );

  return (
    <ContentContext.Provider value={{ allContent, getByAge, addContent, deleteContent, editContent, isLoaded, refreshContent }}>
      {children}
    </ContentContext.Provider>
  );
}

export function useContent(): ContentContextValue {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error("useContent must be used within ContentProvider");
  return ctx;
}
