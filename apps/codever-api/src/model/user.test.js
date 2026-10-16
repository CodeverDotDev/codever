const mongoose = require('mongoose');
const User = require('./user');

describe('User model favorite defaults', () => {
  it('loads a legacy profile without note favorites', () => {
    const user = User.hydrate({
      _id: new mongoose.Types.ObjectId(),
      userId: 'test-user-id',
      favorites: ['bookmark-1'],
    });

    expect(user.favorites).toEqual(['bookmark-1']);
    expect(user.favoriteNotes).toEqual([]);
  });
});
