db.users.find().forEach(
  function(user) {
    print('\nuser ' + user._id);
    var uniqueReadLater = user.readLater.filter(function (x, i, a) {
      return a.indexOf(x) == i;
    });
    db.users.update(
      {_id: user._id},
      {$set: {readLater: uniqueReadLater}}
    );
  }
);
