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
    githubURL: string;
    userId: String;
    shared: boolean;
    language: string;
    createdAt: Date;
    updatedAt: Date;

    constructor (
                 name: string,
                 location: string,
                 language: string,
                 category: string,
                 tags: string[],
                 publishedOn?: Date,
                 githubURL?: string,
                 description?: string,
                 descriptionHtml?: string,
                 _id?: string,
                 tagsLine?: string,
                 userId?: string,
                 shared?: boolean,
                 createdAt?: Date,
                 updatedAt?: Date
                 ) {
        this.name = name;
        this.location = location;
        this.language = language;
        this.category = category;
        this.tags = tags;
        this.githubURL = githubURL;
        this.description = description;
        this.descriptionHtml = descriptionHtml;
        this._id = _id;
        this.tagsLine = tagsLine;
        this.publishedOn = publishedOn;
        this.userId = userId;
        this.shared = shared;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }
}
