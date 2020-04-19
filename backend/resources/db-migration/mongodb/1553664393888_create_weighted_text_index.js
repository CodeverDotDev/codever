db.bookmarks.createIndex(
    {
        name: "text",
        location: "text",
        description: "text",
        tags: "text",
        sourceCodeURL: "text",
    },
    {
        weights: {
            name: 2,
            location: 5,
            description: 1,
            tags: 3,
            sourceCodeURL: 1
        },
        name: "full_text_search",
        default_language: "none",
        language_override: "none"
    }
);

