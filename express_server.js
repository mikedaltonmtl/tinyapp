const express = require("express");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const { getUserByEmail } = require('./helpers.js');

////////////////////////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////////////////////////
const app = express();
const PORT = 8080; // Default port 8080

app.set("view engine", "ejs");

////////////////////////////////////////////////////////////////////////////////
// Middleware
////////////////////////////////////////////////////////////////////////////////
app.use(morgan('dev'));
// parse the body of a POST request (from a 'buffer') to make it human readable
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

////////////////////////////////////////////////////////////////////////////////
// Data
////////////////////////////////////////////////////////////////////////////////
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "user2RandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
  xyBoGr: {
    longURL: "https://www.bob.ca",
    userID: "userRandomID",
  },
  PPPoGr: {
    longURL: "https://www.dave.ca",
    userID: "dave",
  },
  a7BoGr: {
    longURL: "https://www.user.ca",
    userID: "user2RandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "123",
  },
};

////////////////////////////////////////////////////////////////////////////////
// Functions
////////////////////////////////////////////////////////////////////////////////

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
const urlsForUser = function(id) {
  const userUrls = {};
  for (const shortURL of Object.keys(urlDatabase)) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};

////////////////////////////////////////////////////////////////////////////////
// Route Handlers - GET
////////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) { // Short url does not exist in database object
    res.send('Sorry, this short URL doesn\'t exist\n<button onclick="history.back()">Back</button>');
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  const templateVars = { user };
  if (user) { // user already logged-in, redirect to index
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  const templateVars = { user };
  if (user) { // user already logged-in, redirect to index
    res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  const templateVars = { user };
  if (!user) { // user not logged-in, redirect to login
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  if (!user) { // user NOT logged-in, do not allow
    res.send('Please <a href="/login">log-in</a> or <a href="/register">register</a> to continue.');
    return;
  }
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) { // Short url does not exist in database object
    res.status(404).send(`Short URL ${shortURL} does not exist.\n`);
    return;
  }
  const urlOwnerId = urlDatabase[req.params.id].userID;
  const cookieUserId = user.id;
  if (urlOwnerId !== cookieUserId) { // user is not owner of short URL
    res.send('Sorry, you cannot edit a URL you did not create.\n<button onclick="history.back()">Back</button>');
    return;
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  if (!user) { // user is not logged in
    res.send('Please <a href="/login">log-in</a> or <a href="/register">register</a> to continue.');
    return;
  }
  const urls = urlsForUser(user.id);
  const templateVars = {
    urls,
    user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

////////////////////////////////////////////////////////////////////////////////
// Route Handlers - POST
////////////////////////////////////////////////////////////////////////////////

// Create - add new URL to database object
app.post("/urls", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  if (!user) { // user NOT logged-in, do not allow
    res.send('Please <a href="/login">log-in</a> or <a href="/register">register</a> to add a URL');
    return;
  }
  // user IS logged in, add new URL
  const shortURL = generateRandomString(6);
  urlDatabase[shortURL] = {
    longURL: req.body['longURL'],
    userID: user.id,
  };
  res.redirect(`/urls/${shortURL}`);
});

// Delete - remove URL from database object
app.post("/urls/:id/delete", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) { // Short url does not exist in database object
    res.status(404).send(`Short URL ${shortURL} does not exist.\n`);
    return;
  }
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  if (!user) { // user NOT logged-in, do not allow
    res.status(401).send('You must log in to remove a URL\n');
    return;
  }
  const urlOwnerId = urlDatabase[req.params.id].userID;
  const cookieUserId = user.id;
  if (urlOwnerId !== cookieUserId) { // user is not owner of short URL
    res.status(403).send('Sorry, you cannot delete a URL you did not create.\n');
    return;
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

// Update - modify long URL of existing resource
app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) { // Short url does not exist in database object
    res.status(404).send(`Short URL ${shortURL} does not exist.\n`);
    return;
  }
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  if (!user) { // user NOT logged-in, do not allow
    res.status(401).send('You must log in to edit a URL\n');
    return;
  }
  const urlOwnerId = urlDatabase[req.params.id].userID;
  const cookieUserId = user.id;
  if (urlOwnerId !== cookieUserId) { // user is not owner of short URL
    res.status(403).send('Sorry, you cannot edit a URL you did not create.\n');
    return;
  }
  const newLongURL = req.body.longURL;
  urlDatabase[shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

// Logout - clear session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Register - create new user
app.post("/register", (req, res) => {
  // return status 400 if email or password fields are blank
  if (req.body['email'] === "" || req.body['password'] === "") {
    res.status(400);
    res.send('Please provide an email & password\n<button onclick="history.back()">Back</button>');
    return;
  }
  // return status 400 if email already exists in users object
  if (getUserByEmail(req.body['email'], users) !== null) {
    res.status(400);
    res.send('Email already exists\n<button onclick="history.back()">Back</button>');
    return;
  }
  // add user to user database object
  const id = generateRandomString(6); // Generate a new (random) user id
  const email = req.body['email'];
  const password = req.body['password'];
  const hashedPassword = bcrypt.hashSync(password, 10);
  users[id] = {
    id,
    email,
    password: hashedPassword,
  };
  req.session['user_id'] = id;
  res.redirect("/urls");
});

// Login - sign in to an existing account
app.post("/login", (req, res) => {
  const user = getUserByEmail(req.body['email'], users);
  // return status 403 if email not found in users object
  if (user === null) {
    res.status(403);
    res.send('Email cannot be found\n<button onclick="history.back()">Back</button>');
    return;
  }
  // return status 403 if email exists, but password does not match
  if (!bcrypt.compareSync(req.body['password'], user.password)) {
    res.status(403);
    res.send('Incorrect password\n<button onclick="history.back()">Back</button>');
    return;
  }
  // set cookie for logged in user
  req.session['user_id'] = user.id;
  res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
