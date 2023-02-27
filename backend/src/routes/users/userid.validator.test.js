const Token = require('keycloak-connect/middleware/auth-utils/token');
const { validateUserId, validateIsAdminOrUserId } = require('./userid.validator');
const UserIdValidationError = require('./userid-validation.error');

describe('validateUserId()', () => {
  test('should throw error if userId does not match sub in access token', () => {
    const request = {
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: '123'
            }
          }
        }
      },
      params: {
        userId: '456'
      }
    };
    expect(() => {
      validateUserId(request);
    }).toThrow(UserIdValidationError);
  });

  test('should not throw error if userId matches sub in access token', () => {
    const request = {
      kauth: {
        grant: {
          access_token: {
            content: {
              sub: '123'
            }
          }
        }
      },
      params: {
        userId: '123'
      }
    };
    expect(() => {
      validateUserId(request);
    }).not.toThrow();
  });
});


// TODO give it a try later when mocking works...
// describe('validateIsAdminOrUserId()', () => {
//   test('should throw error if user is not an admin and userId does not match sub in access token', () => {
//     const token = new Token('access_token', 'bookmarks-api');
//     jest.spyOn(token, 'hasRealmRole').mockImplementation(() => false);
//     const request = {
//       kauth: {
//         grant: {
//           access_token: {
//             token: token,
//             content: {
//               sub: '123'
//             }
//           }
//         }
//       },
//       params: {
//         userId: '456'
//       }
//     };
//     expect(() => {
//       validateIsAdminOrUserId(request);
//     }).toThrow(UserIdValidationError);
//   });
//
//   test('should not throw error if user is an admin', () => {
//     const token = new Token('access_token', 'bookmarks-api');
//     jest.spyOn(token, 'hasRealmRole').mockImplementation(() => true);
//     const request = {
//       kauth: {
//         grant: {
//           access_token: {
//             token: token,
//           }
//         }
//       },
//       params: {
//         userId: '456'
//       }
//     };
//     expect(() => {
//       validateIsAdminOrUserId(request);
//     }).not.toThrow();
//   });
//
//   test('should not throw error if userId matches sub in access token', (object, method) => {
//     const token = new Token('access_token', 'bookmarks-api');
//     jest.spyOn(token, 'hasRealmRole').mockReturnValue(false);
//     const request = {
//       kauth: {
//         grant: {
//           access_token: {
//             token: 'fake-access-token',
//             content: {
//               sub: '123'
//             }
//           }
//         }
//       },
//       params: {
//         userId: '123'
//       }
//     };
//     expect(() => {
//       validateIsAdminOrUserId(request);
//     }).not.toThrow();
//   });
// });


// describe('validateIsAdminOrUserId()', () => {
//   test('should throw error if user is not an admin and userId does not match sub in access token', () => {
//     const token = new Token('fake-access-token', 'bookmarks-api');
//     const hasRealmRoleMock = jest.fn().mockReturnValue(false);
//     token.hasRealmRole = hasRealmRoleMock;
//     const request = {
//       kauth: {
//         grant: {
//           access_token: {
//             token: token,
//             content: {
//               sub: '123'
//             }
//           }
//         }
//       },
//       params: {
//         userId: '456'
//       }
//     };
//     expect(() => {
//       validateIsAdminOrUserId(request);
//     }).toThrow(UserIdValidationError);
//     expect(token.hasRealmRole).toHaveBeenCalledWith('ROLE_ADMIN');
//   });
//
//   test('should not throw error if user is an admin', () => {
//     const token = new Token('fake-access-token', 'bookmarks-api');
//     token.hasRealmRole = jest.fn().mockReturnValue(true);
//     const request = {
//       kauth: {
//         grant: {
//           access_token: {
//             token: token
//           }
//         }
//       },
//       params: {
//         userId: '456'
//       }
//     };
//     expect(() => {
//       validateIsAdminOrUserId(request);
//     }).not.toThrow();
//     expect(token.hasRealmRole).toHaveBeenCalledWith('ROLE_ADMIN');
//   });
//
//   test('should not throw error if userId matches sub in access token', () => {
//     const token = new Token('fake-access-token', 'bookmarks-api');
//     const hasRealmRoleMock = jest.fn().mockReturnValue(false);
//     token.hasRealmRole = hasRealmRoleMock;
//     const request = {
//       kauth: {
//         grant: {
//           access_token: {
//             token: token,
//             content: {
//               sub: '123'
//             }
//           }
//         }
//       },
//       params: {
//         userId: '123'
//       }
//     };
//     expect(() => {
//       validateIsAdminOrUserId(request);
//     }).not.toThrow();
//     expect(token.hasRealmRole).toHaveBeenCalledWith('ROLE_ADMIN');
//   });
// });
