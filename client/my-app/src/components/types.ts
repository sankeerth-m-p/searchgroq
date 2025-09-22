// types.ts (optional)
export type SearchInfo = {
  stages: string[];     // e.g. ['searching','reading','writing','error']
  query?: string;
  urls?: string[];
  error?: string;
};

export type Message = {
  id: string;
  content: string;
  isUser: boolean;
  isLoading?: boolean;
  searchInfo?: SearchInfo;
};
