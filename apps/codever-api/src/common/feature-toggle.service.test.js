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

  describe('isFeatureEnabled (generic)', () => {
    const featureToggleService = require('./feature-toggle.service');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns true when userId is enabled for the named feature', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          mcpServer: { enabledUserIds: ['user-abc'] },
        })
      );

      expect(featureToggleService.isFeatureEnabled('mcpServer', 'user-abc')).toBe(
        true
      );
    });

    test('returns false when the named feature is missing', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ aiNoteRefine: { enabledUserIds: ['user-abc'] } })
      );

      expect(
        featureToggleService.isFeatureEnabled('nonExistent', 'user-abc')
      ).toBe(false);
    });
  });

  describe('isAiAssistantEnabled', () => {
    const featureToggleService = require('./feature-toggle.service');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns true when userId is in the aiAssistant enabled list', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ aiAssistant: { enabledUserIds: ['user-abc'] } })
      );

      expect(featureToggleService.isAiAssistantEnabled('user-abc')).toBe(true);
    });

    test('returns false when userId is not enabled', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ aiAssistant: { enabledUserIds: [] } })
      );

      expect(featureToggleService.isAiAssistantEnabled('user-abc')).toBe(false);
    });
  });

  describe('isMcpServerEnabled', () => {
    const featureToggleService = require('./feature-toggle.service');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns true when userId is in the mcpServer enabled list', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ mcpServer: { enabledUserIds: ['user-xyz'] } })
      );

      expect(featureToggleService.isMcpServerEnabled('user-xyz')).toBe(true);
    });

    test('returns false when userId is not enabled', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({ mcpServer: { enabledUserIds: [] } })
      );

      expect(featureToggleService.isMcpServerEnabled('user-xyz')).toBe(false);
    });
  });

  describe('getFeatureToggles (batch)', () => {
    const featureToggleService = require('./feature-toggle.service');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('reads the file once and returns all known toggles for the user', () => {
      fs.readFileSync.mockReturnValue(
        JSON.stringify({
          aiNoteRefine: { enabledUserIds: ['user-abc'] },
          aiAssistant: { enabledUserIds: ['user-abc', 'user-xyz'] },
          mcpServer: { enabledUserIds: ['user-xyz'] },
        })
      );

      expect(featureToggleService.getFeatureToggles('user-abc')).toEqual({
        aiNoteRefine: true,
        aiAssistant: true,
        mcpServer: false,
      });
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    test('defaults every known toggle to false when features are missing', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({}));

      expect(featureToggleService.getFeatureToggles('any-user')).toEqual({
        aiNoteRefine: false,
        aiAssistant: false,
        mcpServer: false,
      });
    });

    test('returns all false when JSON is malformed', () => {
      fs.readFileSync.mockReturnValue('not valid json {{{');

      expect(featureToggleService.getFeatureToggles('any-user')).toEqual({
        aiNoteRefine: false,
        aiAssistant: false,
        mcpServer: false,
      });
    });
  });
});
