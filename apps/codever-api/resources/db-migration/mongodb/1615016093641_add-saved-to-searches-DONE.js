db.users.find().forEach(function (e) {
  if (e.searches) {
    for (var i = 0; i < e.searches.length; i++) {
      e.searches[i].saved = true;
    }
    db.users.save(e);
    print('\nsaved for user  ' + e._id);
  } else {
    print('\nNOT saved for user  ' + e._id);
  }
});
