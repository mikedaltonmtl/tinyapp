// Function returns user (object) if email is found or NULL if not
const getUserByEmail = function(email, database) {
  for (const userId of Object.keys(database)) {
    if (database[userId]['email'] === email) {
      return database[userId];
    }
  }
  return null;
};

module.exports = { getUserByEmail };