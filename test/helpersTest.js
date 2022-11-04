const { assert } = require('chai');

const {
  getUserByEmail,
  urlsForUser,
} = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {

  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    assert.equal(user.id, expectedUserID);
  });

  it('should return null if email is invalid', function() {
    const user = getUserByEmail("user3@example.com", testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID);
  });

  it('should return null if email is empty', function() {
    const user = getUserByEmail("", testUsers);
    const expectedUserID = null;
    assert.equal(user, expectedUserID);
  });

});

const testUrlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  Y6UTA5: {
    longURL: "https://www.cbc.ca",
    userID: "userRandomID",
  },
  TTTxQ3: {
    longURL: "https://www.abc.com",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

describe('urlsForUser', function() {

  it('should return short URL object i3BoGr for user user2RandomID', function() {
    const urlObject = urlsForUser("user2RandomID", testUrlDatabase);
    const expectedObject = {
      i3BoGr: {
        longURL: "https://www.google.ca",
        userID: "user2RandomID",
      }
    };
    assert.deepEqual(urlObject, expectedObject);
  });

  it('should return 3 short URL objects (b6UTxQ, Y6UTA5, TTTxQ3) for user userRandomID', function() {
    const urlObject = urlsForUser("userRandomID", testUrlDatabase);
    const expectedObject = {
      b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "userRandomID",
      },
      Y6UTA5: {
        longURL: "https://www.cbc.ca",
        userID: "userRandomID",
      },
      TTTxQ3: {
        longURL: "https://www.abc.com",
        userID: "userRandomID",
      }
    };
    assert.deepEqual(urlObject, expectedObject);
  });

  it('should return an empty object for a non existant user user3RandomID', function() {
    const urlObject = urlsForUser("user3RandomID", testUrlDatabase);
    const expectedResult = {};
    assert.deepEqual(urlObject, expectedResult);
  });

});