export class Bookmark {
    _id: string;
    name: string;
    location: string;
    description: string;
    category: string;
    tags: string[];

    constructor (_id: string, name: string, location: string, category: string, tags: string[], description?: string){
        this.name = name;
        this._id = _id;
        this.location = location;
        this.description = description;
        this.category = category;
        this.tags = tags;
    }
}
