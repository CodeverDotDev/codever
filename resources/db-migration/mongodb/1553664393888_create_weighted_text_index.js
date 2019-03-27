db.bookmarks.createIndex(
    {
        name: "text",
        location: "text",
        description: "text",
        tags: "text",
        githubURL: "text",
    },
    {
        weights: {
            name: 2,
            location: 3,
            description: 1,
            tags: 3,
            githubURL: 1
        },
        name: "full_text_search",
        default_language: "none",
        language_override: "none"
    }
)

