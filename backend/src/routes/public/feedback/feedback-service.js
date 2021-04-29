const Feedback = require('../../../model/feedback');


let createFeedback = async function (feedback) {
  const newFeedback = new Feedback({
    question: feedback.question,
    userResponse: feedback.userResponse,
    userId: feedback.userId,
    userAgent: feedback.userAgent
  });

  const createdFeedback = await newFeedback.save();

  return createdFeedback;
}

module.exports = {
  createFeedback: createFeedback
}
