export interface ContentItem {
  id: string;
  title: string;
  description: string;
  type: "text" | "audio" | "video";
  duration?: string;
  fileUrl?: string;
  ageGroup: AgeGroup;
  postedBy: string;
  postedAt: string;
  isNew?: boolean;
}

export type AgeGroup = "0-6" | "7-12" | "13-24" | "25-59";

export interface AgeCategory {
  id: AgeGroup;
  label: string;
  sublabel: string;
  color: string;
  bgColor: string;
  iconName: string;
  description: string;
}

export const AGE_CATEGORIES: AgeCategory[] = [
  {
    id: "0-6",
    label: "0 - 6",
    sublabel: "Amezi",
    color: "#1A8A3A",
    bgColor: "#E8F5EC",
    iconName: "child",
    description: "Inzira z'imirire yo konka no gukurikirana imbaga y'umwana",
  },
  {
    id: "7-12",
    label: "7 - 12",
    sublabel: "Amezi",
    color: "#2980B9",
    bgColor: "#EBF5FB",
    iconName: "child",
    description: "Guteranya amata yo konka n'ibiryo bya mbere kuri umwana",
  },
  {
    id: "13-24",
    label: "13 - 24",
    sublabel: "Amezi",
    color: "#8E44AD",
    bgColor: "#F4ECF7",
    iconName: "child",
    description: "Imirire myiza yuzuye kuri umwana uri gutera imbere",
  },
  {
    id: "25-59",
    label: "25 - 59",
    sublabel: "Amezi",
    color: "#D35400",
    bgColor: "#FDEBD0",
    iconName: "child",
    description: "Imirire myiza kuri umwana ukuze ku mwaka 2 kugeza 5",
  },
];

export const CONTENT_DATA: ContentItem[] = [];

export function getContentByAge(ageGroup: AgeGroup): ContentItem[] {
  return CONTENT_DATA.filter((item) => item.ageGroup === ageGroup);
}

export interface AdminStats {
  totalContent: number;
  textCount: number;
  audioCount: number;
  videoCount: number;
  totalParents: number;
}

export const ADMIN_STATS: AdminStats = {
  totalContent: 0,
  textCount: 0,
  audioCount: 0,
  videoCount: 0,
  totalParents: 0,
};
