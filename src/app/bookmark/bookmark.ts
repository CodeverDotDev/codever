export class Bookmark {
    id: string;
    name: string;
    location: string;
    description: string;
    category: string;
    tags: string[];

    constructor (id: string, name: string, location: string, category: string, tags: string[], description?: string){
        this.name = name;
        this.id = id;
        this.location = location;
        this.description = description;
        this.category = category;
        this.tags = tags;
    }
}
