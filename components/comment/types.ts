export interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

export interface Comment {
  id: string;
  content: string;
  articleId: string;
  userId: string | null;
  parentId: string | null;
  authorName: string | null;
  createdAt: string; // JSON dates are strings
  updatedAt: string;
  user: CommentUser | null;
  replies?: Comment[];
}

