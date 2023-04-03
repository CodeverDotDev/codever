class UserIdValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserIdValidationError';
  }
}

module.exports = UserIdValidationError;
