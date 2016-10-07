export class Bookmark {
    name: string;
    url: string;
    description: string;
    category: string;
    tags: string[];

    constructor (name: string, url: string, category: string, tags: string[], description?: string){
        this.name = name;
        this.url = url;
        this.description = description;
        this.category = category;
        this.tags = tags;  
    }
}