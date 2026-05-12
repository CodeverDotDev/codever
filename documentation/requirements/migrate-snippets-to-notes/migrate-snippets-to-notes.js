// Migration script: Snippets → Notes
// ====================================
// Converts every document in the "snippets" collection into a "notes" document.
//
// What it does per snippet:
//  - Converts codeSnippets[] into a single Markdown string:
//      - comment      → plain text paragraph before the code fence
//      - code         → fenced code block  (language taken from codeSnippet.language
//                         or the top-level snippet.language field)
//      - commentAfter → plain text paragraph after the code fence
//      - Multiple code sections are separated by a Markdown horizontal rule (---)
//  - Copies: title, userId, tags (+ adds "code-snippet" tag), reference,
//            public, shareableId, origin (location/file/project/workspace),
//            createdAt, updatedAt
//  - Sets: type = 'note', contentType = 'markdown'
//
// Run with:
//   mongo <connectionString>/<dbName> migrate-snippets-to-notes.js
//
//   or in mongosh:
//   load("migrate-snippets-to-notes.js")
//
// The script is IDEMPOTENT: it skips snippets that have already been migrated
// (checked via the "migratedFromSnippetId" field on existing notes).
//
// IMPORTANT: Run against a database backup first!

// ─── helper ───────────────────────────────────────────────────────────────────

// Converts a codeSnippets array into a single Markdown string.
// Multiple sections are separated by a horizontal rule.
//
// @param {Array}  codeSnippets  - snippet.codeSnippets
// @param {string} defaultLang   - snippet.language (fallback)
// @returns {string}
function buildMarkdownContent(codeSnippets, defaultLang) {
  if (!codeSnippets || codeSnippets.length === 0) {
    return '';
  }

  var sections = codeSnippets.map(function (cs) {
    var parts = [];
    var lang = (cs.language || defaultLang || '').trim();

    if (cs.comment && cs.comment.trim()) {
      parts.push(cs.comment.trim());
    }

    var fence = '```' + lang;
    parts.push(fence);
    parts.push((cs.code || '').replace(/\s+$/, ''));
    parts.push('```');

    if (cs.commentAfter && cs.commentAfter.trim()) {
      parts.push(cs.commentAfter.trim());
    }

    return parts.join('\n');
  });

  return sections.join('\n\n---\n\n');
}

// ─── migration ────────────────────────────────────────────────────────────────

var snippetsCollection = db.getCollection('snippets');
var notesCollection    = db.getCollection('notes');

var stats = { total: 0, inserted: 0, skipped: 0, errors: 0 };

snippetsCollection.find({}).forEach(function (snippet) {
  stats.total++;

  var snippetIdStr = snippet._id.toString();

  // Idempotency check: skip if a note with the same _id already exists
  if (notesCollection.findOne({ _id: snippet._id })) {
    stats.skipped++;
    print('SKIP (already migrated): ' + snippetIdStr + ' – ' + snippet.title);
    return;
  }

  try {
    // Build tags: keep all existing tags and add "code-snippet" if not already there
    var tags = (snippet.tags || []).slice();
    if (tags.indexOf('code-snippet') === -1) {
      tags.push('code-snippet');
    }

    var markdownContent = buildMarkdownContent(
      snippet.codeSnippets,
      snippet.language
    );

    var noteDoc = {
      // Preserve the original snippet _id so public URLs keep working
      _id:         snippet._id,
      // Core fields
      title:       snippet.title,
      type:        'note',
      contentType: 'markdown',
      content:     markdownContent,
      tags:        tags,
      userId:      snippet.userId,
      public:      snippet.public || false,

      // Optional fields (only set when present on the source)
      reference:   snippet.reference || null,

      // Preserve timestamps
      createdAt:   snippet.createdAt,
      updatedAt:   snippet.updatedAt,

      // Traceability – lets us detect already-migrated records on re-run
      migratedFromSnippetId: snippet._id,
    };

    // Preserve shareableId only when set (it is select:false so may be absent
    // when retrieved via the normal API, but direct mongo access returns it)
    if (snippet.shareableId) {
      noteDoc.shareableId = snippet.shareableId;
    }

    // Preserve origin metadata set by IDE extensions (VS Code, IntelliJ, etc.)
    // Only a subset of notes (those saved from an IDE) will have this field.
    if (snippet.origin && (
      snippet.origin.location ||
      snippet.origin.file     ||
      snippet.origin.project  ||
      snippet.origin.workspace
    )) {
      noteDoc.origin = {
        location:  snippet.origin.location  || null,
        file:      snippet.origin.file      || null,
        project:   snippet.origin.project   || null,
        workspace: snippet.origin.workspace || null,
      };
    }

    notesCollection.insertOne(noteDoc);
    stats.inserted++;
    print('OK: ' + snippetIdStr + ' – ' + snippet.title);

  } catch (e) {
    stats.errors++;
    print('ERROR for ' + snippetIdStr + ' – ' + snippet.title + ': ' + e);
  }
});

// ─── summary ──────────────────────────────────────────────────────────────────

print('');
print('═══════════════════════════════════════');
print('Migration complete');
print('  Total snippets : ' + stats.total);
print('  Inserted       : ' + stats.inserted);
print('  Skipped        : ' + stats.skipped);
print('  Errors         : ' + stats.errors);
print('═══════════════════════════════════════');
print('');
print('Next steps:');
print('  1. Verify the migrated notes in the "notes" collection.');
print('  2. Once satisfied, you can drop the "snippets" collection:');
print('       db.snippets.drop()');
print('  3. Remove the "migratedFromSnippetId" field from all notes:');
print('       db.notes.updateMany({},{$unset:{migratedFromSnippetId:""}})');

