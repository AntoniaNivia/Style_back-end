export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  type: 'USER' | 'STORE';
  gender: 'FEMALE' | 'MALE' | 'OTHER';
  mannequinPreference: 'Woman' | 'Man' | 'Neutral';
  style?: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClothingItem {
  id: string;
  userId: string;
  photoUrl: string;
  type: string;
  color: string;
  season: string;
  occasion: string;
  tags: string[];
  createdAt: Date;
}

export interface FeedPost {
  id: string;
  storeId: string;
  imageUrl: string;
  caption: string;
  createdAt: Date;
  store: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  likesCount: number;
  isLiked?: boolean;
}

export interface SavedOutfit {
  id: string;
  userId: string;
  imageUrl: string;
  reasoning: string;
  itemsJson: string;
  items?: any[];
  createdAt: Date;
}

export interface OutfitGeneration {
  selectedItems: Array<{
    id: string;
    type: string;
    reason: string;
  }>;
  reasoning: string;
  styleNotes: string;
  mannequinImagePrompt: string;
  confidence: number;
  outfitId?: string;
  mannequinImage?: string;
}
