
export interface Deal {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  store: string;
  link: string;
  image: string;
  coupon?: string;
  createdAt: any;
}