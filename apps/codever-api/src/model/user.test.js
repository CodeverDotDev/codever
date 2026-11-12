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

  it('does not set a home tab order until one is saved', () => {
    const user = new User({ userId: 'test-user-id' });

    expect(user.homeTabs).toBeUndefined();
  });
});
