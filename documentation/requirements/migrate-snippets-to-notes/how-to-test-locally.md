# Testing the Snippets → Notes Migration Locally (Docker)

## Prerequisites

- Docker and docker-compose installed
- The `codever-mongo` container running (uses `mongo:3.4`)

> **Note:** Since docker-compose uses `mongo:3.4`, use the `mongo` shell (not `mongosh`).
> If you later upgrade to a newer MongoDB image, replace `mongo` with `mongosh` in the commands below.

---

## 1. Start the MongoDB container

```bash
cd F:/projects/personal/codever
docker-compose up -d mongo
```

## 2. Insert test snippets into the local DB

```bash
docker exec -it codever-mongo mongo -u bookmarks -p secret \
  --authenticationDatabase dev-bookmarks dev-bookmarks --eval '
db.snippets.insertMany([
  {
    title: "Test Snippet 1",
    language: "javascript",
    tags: ["javascript", "test"],
    public: true,
    userId: "a7908cb5-3b37-4cc1-a751-42f674d870e1",
    codeSnippets: [
      { comment: "Hello world example", code: "console.log(\"hello\")", language: "javascript" }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    title: "Test Snippet 2",
    language: "python",
    tags: ["python"],
    public: false,
    userId: "a7908cb5-3b37-4cc1-a751-42f674d870e1",
    codeSnippets: [
      { comment: "Print example", code: "print(\"hi\")", language: "python" },
      { comment: "Another block", code: "x = 42", language: "python", commentAfter: "The answer" }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
])'
```

## 3. Run the migration script

```bash
docker exec -i codever-mongo mongo -u bookmarks -p secret \
  --authenticationDatabase dev-bookmarks dev-bookmarks \
  < documentation/requirements/migrate-snippets-to-notes/migrate-snippets-to-notes.js
```

## 4. Verify the results

Check that `_id` was preserved from snippets to notes:

```bash
docker exec -it codever-mongo mongo -u bookmarks -p secret \
  --authenticationDatabase dev-bookmarks dev-bookmarks --eval '
print("=== SNIPPETS ===");
db.snippets.find({}, {_id:1, title:1}).forEach(printjson);
print("=== NOTES (migrated) ===");
db.notes.find(
  {migratedFromSnippetId:{$exists:true}},
  {_id:1, title:1, tags:1, type:1, contentType:1, content:1}
).forEach(printjson);
print("=== ID match check ===");
db.snippets.find().forEach(function(s) {
  var note = db.notes.findOne({_id: s._id});
  print(s._id + " -> " + (note ? "MATCH OK" : "MISSING!"));
});'
```

## 5. Test idempotency

Run the script a second time — all snippets should be reported as `SKIP (already migrated)`:

```bash
docker exec -i codever-mongo mongo -u bookmarks -p secret \
  --authenticationDatabase dev-bookmarks dev-bookmarks \
  < documentation/requirements/migrate-snippets-to-notes/migrate-snippets-to-notes.js
```

## 6. Clean up test data

```bash
docker exec -it codever-mongo mongo -u bookmarks -p secret \
  --authenticationDatabase dev-bookmarks dev-bookmarks --eval '
db.snippets.drop();
db.notes.deleteMany({migratedFromSnippetId:{$exists:true}});'
```

