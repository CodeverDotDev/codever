module.exports = function (config) {
  config.set({
    frameworks: ['jasmine'],
    plugins: [require('karma-jasmine'), require('karma-chrome-launcher')],
    reporters: ['dots'],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    client: { jasmine: { random: false } },
  });
};
