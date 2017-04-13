export class Bookmark {
    _id: string;
    name: string;
    location: string;
    description: string;
    descriptionHtml: string;
    category: string;
    tags: string[];
    tagsLine: string;
    publishedOn: Date;
    userId: String;
    shared: boolean;

    constructor (
                 name: string,
                 location: string,
                 category: string,
                 tags: string[],
                 publishedOn?: Date,
                 description?: string,
                 descriptionHtml?: string,
                 _id?: string,
                 tagsLine?: string,

                 userId?: string,
                 shared?: boolean
                 ){
        this.name = name;
        this.location = location;
        this.category = category;
        this.tags = tags;
        this.description = description;
        this.descriptionHtml = descriptionHtml;
        this._id = _id;
        this.tagsLine = tagsLine;
        this.publishedOn = publishedOn;
        this.userId = userId;
        this.shared = shared;
    }
}
