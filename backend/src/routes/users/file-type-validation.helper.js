const ValidationError = require('../../error/validation.error');

const imageFilter = function(req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new ValidationError('Method accespts only images [jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF]', ['The file uploaded is not an image']), false);
  }
  cb(null, true);
};

const htmlFileFilter = function(req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(html|HTML|xhtml)$/)) {
    req.fileValidationError = 'Only html files are allowed!';
    return cb(new ValidationError('Method accespts only images [html|HTML|xhtml]', ['The file uploaded is not a html file']), false);
  }
  cb(null, true);
};

module.exports = {
  imageFilter: imageFilter,
  htmlFileFilter: htmlFileFilter
};
