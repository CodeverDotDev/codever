export class Bookmark {
    name: string;
    location: string;
    description: string;
    category: string;
    tags: string[];

    constructor (name: string, location: string, category: string, tags: string[], description?: string){
        this.name = name;
        this.location = location;
        this.description = description;
        this.category = category;
        this.tags = tags;
    }
}
