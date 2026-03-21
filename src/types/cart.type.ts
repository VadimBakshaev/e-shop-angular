export type CartType = {
    items: CartItems[];
}

export type CartItems = {
    product:CartProduct;
    quantity: number;
}

export type CartProduct = {
    id: string;
    name: string;
    url: string;
    image: string;
    price: number;
}