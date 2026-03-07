export interface Post{
    id: number,
    text: string,
    tags: Tag[],
    createdAt: Date,
}
export interface Tag{
    name: string,
}