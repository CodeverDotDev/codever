const Bookmark = require('../../model/bookmark');

let getTopPublicTags = async (location) => {
  const bookmark = await Bookmark.findOne({
    'public': true,
    location: location
  }).lean().exec();
  if ( !bookmark ) {
    return [];
  } else {
    return [bookmark];
  }
}


module.exports = {
  getTopPublicTags: getTopPublicTags
};
