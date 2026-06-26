const path = require('path');

// Mock fs.readFileSync at module level
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

const fs = require('fs');

describe('feature-toggle.service', () => {
  describe('isAiNoteRefineEnabled', () => {
    const togglesPath = path.resolve(__dirname, '../../feature-toggles.json');

    // The service reads the file on each call, so we just need to mock fs
    const featureToggleService = require('./feature-toggle.service');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns false when feature-toggles.json is missing', () => {
      fs.readFileSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(featureToggleService.isAiNoteRefineEnabled('any-user')).toBe(false);
    });

    test('returns true when userId is in the enabled list', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          aiNoteRefine: {
            enabledUserIds: ['user-abc', 'user-xyz'],
          },
        })
      );

      expect(featureToggleService.isAiNoteRefineEnabled('user-abc')).toBe(true);
      expect(featureToggleService.isAiNoteRefineEnabled('user-xyz')).toBe(true);
    });

    test('returns false when userId is not in the enabled list', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          aiNoteRefine: {
            enabledUserIds: ['user-abc'],
          },
        })
      );

      expect(featureToggleService.isAiNoteRefineEnabled('user-unknown')).toBe(false);
    });

    test('returns false when enabledUserIds is empty', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          aiNoteRefine: {
            enabledUserIds: [],
          },
        })
      );

      expect(featureToggleService.isAiNoteRefineEnabled('any-user')).toBe(false);
    });

    test('returns false when aiNoteRefine section is missing', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          someOtherFeature: {},
        })
      );

      expect(featureToggleService.isAiNoteRefineEnabled('any-user')).toBe(false);
    });

    test('returns false when JSON is malformed', () => {
      fs.readFileSync.mockReturnValue('not valid json {{{');

      expect(featureToggleService.isAiNoteRefineEnabled('any-user')).toBe(false);
    });
  });
});
