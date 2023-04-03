const ValidationError = require('../../error/validation.error');

const htmlFileFilter = function (req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(html|HTML|xhtml)$/)) {
    req.fileValidationError = 'Only html files are allowed!';
    return cb(
      new ValidationError('Method accespts only images [html|HTML|xhtml]', [
        'The file uploaded is not a html file',
      ]),
      false
    );
  }
  cb(null, true);
};
exports.imageFilter = htmlFileFilter;
