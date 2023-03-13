class ValidationError extends Error {
  constructor(message, validationErrors) {
    super(message);
    this.validationErrors = validationErrors;
    this.name = 'ValidationError'
  }
}

module.exports = ValidationError;
