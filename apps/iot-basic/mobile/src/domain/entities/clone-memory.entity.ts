export interface CloneMemoryRecord {
  id: number;
  memoryLevel: string;
  memoryKind: string;
  summary?: string;
  content?: string;
  importance: number;
  updatedTime?: number;
}

export interface CloneMemoryProfile {
  profileText?: string;
  updatedTime?: number;
}
