/** SAKINA data — quiet-luxury natural stone collection and local demo order records. */

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export const products: Product[] = [
  {
    id: "classic-black-agate",
    name: "Classic Black Agate Misbaha",
    description: "Symmetric black agate beads for ultimate focus and elegance.",
    price: 1200,
    image: "/assets/sakina-classic-black_ad9adf39.jpg",
  },
  {
    id: "royal-yemeni",
    name: "Royal Yemeni Agate Subha",
    description:
      "Hand-picked deep red Yemeni stones with a premium silk tassel.",
    price: 1850,
    image: "/assets/sakina-yemeni_80922875.jpg",
  },
  {
    id: "raw-earth",
    name: "Raw Earth Essence",
    description: "Nature in its purest form, peace in its rawest state.",
    price: 600,
    image: "/assets/sakina-raw-earth_c15db049.jpg",
  },
];

export type OrderStatus = "NEW" | "SHIPPING" | "PROCESSING";

export type OrderRecord = {
  id: string;
  customer: string;
  items: string;
  total: number;
  status: OrderStatus;
};

export const egp = (amount: number) => `${amount.toLocaleString("en-US")} EGP`;
