// Function returns user (object) if email is found or NULL if not
const getUserByEmail = function(email, database) {
  for (const userId of Object.keys(database)) {
    if (database[userId]['email'] === email) {
      return database[userId];
    }
  }
  return null;
};

// Create a random string of alphanumeric characters, of length 'nbChars'
const generateRandomString = function(nbChars = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < nbChars; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Function returns urlDatabase filtered by userId (id)
const urlsForUser = function(id, database) {
  const userUrls = {};
  for (const shortURL of Object.keys(database)) {
    if (database[shortURL].userID === id) {
      userUrls[shortURL] = database[shortURL];
    }
  }
  return userUrls;
};

module.exports = {
  getUserByEmail,
  generateRandomString,
  urlsForUser
};
