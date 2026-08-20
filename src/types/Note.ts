export interface Note {
  id: string;
  text: string;
  createdAt: string;
  updatedAt?: string;
  isFavorite?: boolean;
  mood?: string;
  photoUri?: string;
  revealAt?: string;
  tags?: string[];
}
