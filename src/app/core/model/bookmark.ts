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

    constructor (
                 name: string,
                 location: string,
                 category: string,
                 tags: string[],
                 publishedOn?: Date,
                 githubURL?: string,
                 description?: string,
                 descriptionHtml?: string,
                 _id?: string,
                 language?: string,
                 tagsLine?: string,
                 userId?: string,
                 shared?: boolean
                 ) {
        this.name = name;
        this.location = location;
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
        this.language = language;
    }
}
