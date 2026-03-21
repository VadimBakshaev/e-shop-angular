export type TypesType = {
    id: string;
    name: string;
    category: CategoryType;
    url: string;
}

export type CategoryType = {
    id: string;
    name: string;
    url: string;
}

export type CategoryWithType = {
    id: string;
    name: string;
    url: string;
    types: {
        id: string;
        name: string;
        url: string;
    }[];
    urlTypes?:string[];
}