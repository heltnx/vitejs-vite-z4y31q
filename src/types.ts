export interface Gift {
  id: string;
  name?: string;
  price?: number;
  url?: string;
  imageUrl?: string;
  reservedBy?: string;
  purchased?: boolean;
}

export interface List {
  id: string;
  name: string;
  gifts: Gift[];
}