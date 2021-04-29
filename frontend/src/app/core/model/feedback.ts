export interface Feedback {
  _id?: string;
  question: string,
  userResponse: string,
  userId?: string,
  userAgent?: string, // browser - navigator.userAgent - https://developer.mozilla.org/en-US/docs/Web/API/Window/navigator
  createdAt?: Date;
  updatedAt?: Date;
}
