const express = require("express");
const morgan = require('morgan');
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const {
  getUserByEmail,
  generateRandomString,
  urlsForUser
} = require('./helpers.js');

////////////////////////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////////////////////////
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.set('trust proxy', 1);

////////////////////////////////////////////////////////////////////////////////
// Middleware
////////////////////////////////////////////////////////////////////////////////
app.use(morgan('dev'));
// parse the body of a POST request (from a 'buffer') to make it human readable
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(methodOverride('_method'));

////////////////////////////////////////////////////////////////////////////////
// Data
////////////////////////////////////////////////////////////////////////////////
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
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

const visits = [
  {
    shortURL:   'a7BoGr',
    visitorId:  'user@example.com',
    timestamp:  1667480237474,
  },
];

////////////////////////////////////////////////////////////////////////////////
// Route Handlers - GET
////////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  const templateVars = { user };
  if (user) { // user already logged-in
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) { // Short url does not exist in database object
    res.status(404).send('Sorry, either this short URL doesn\'t exist or your long URL was not found (don\'t forget to include HTTP://)\n<button onclick="history.back()">Back</button>');
    return;
  }
  const longURL = urlDatabase[shortURL].longURL;
  const timestamp = Date.now();
  // get visitorId if it already exists, else generate a new one & set as cookie
  let visitorId = '';
  if (req.session.visitor_id) {
    visitorId = req.session.visitor_id;
  } else {
    visitorId = generateRandomString(6);
    req.session['visitor_id'] = visitorId;
  }
  visits.push({ // log visit to visits database array
    shortURL,
    visitorId,
    timestamp,
  });
  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  const templateVars = { user };
  if (user) { // user already logged-in
    res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.get("/register", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  const templateVars = { user };
  if (user) { // user already logged-in
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
    res.status(401).send('Please <a href="/login">log-in</a> or <a href="/register">register</a> to continue.');
    return;
  }
  const shortURL = req.params.id;
  if (!urlDatabase[shortURL]) { // Short url does not exist in database object
    res.status(404).send(`Short URL ${shortURL} does not exist.\n<button onclick="history.back()">Back</button>`);
    return;
  }
  const urlOwnerId = urlDatabase[req.params.id].userID;
  const cookieUserId = user.id;
  if (urlOwnerId !== cookieUserId) { // user is not owner of short URL
    res.status(403).send('Sorry, you cannot edit a URL you did not create.\n<button onclick="history.back()">Back</button>');
    return;
  }
  // Analytics...
  const filteredVisits = visits.filter(visit => visit.shortURL === shortURL);
  // gather IDs of unique visitors to have visited the short URL
  const visitors = [];
  filteredVisits.forEach(visit => {
    if (!visitors.includes(visit.visitorId)) {
      visitors.push(visit.visitorId);
    }
  });
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user,
    visits: filteredVisits,
    totalVisits: filteredVisits.length,
    uniqueVisitors: visitors.length,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  if (!user) { // user is not logged in
    res.status(401).send('Please <a href="/login">log-in</a> or <a href="/register">register</a> to continue.');
    return;
  }
  const urls = urlsForUser(user.id, urlDatabase);
  const templateVars = {
    urls,
    user,
  };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

////////////////////////////////////////////////////////////////////////////////
// Route Handlers - POST
////////////////////////////////////////////////////////////////////////////////

// Logout - clear session
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

// Create - add new URL to database object
app.post("/urls", (req, res) => {
  const user = req.session["user_id"] ? users[req.session["user_id"]] : false;
  if (!user) { // user NOT logged-in, do not allow
    res.status(401).send('Please <a href="/login">log-in</a> or <a href="/register">register</a> to add a URL');
    return;
  }
  const shortURL = generateRandomString(6); // user IS logged in, add new URL
  urlDatabase[shortURL] = {
    longURL: req.body['longURL'],
    userID: user.id,
  };
  res.redirect(`/urls/${shortURL}`);
});

// Register - create new user
app.post("/register", (req, res) => {
  // return status 400 if email or password fields are blank
  if (req.body['email'] === "" || req.body['password'] === "") {
    res.status(400).send('Please provide an email & password\n<button onclick="history.back()">Back</button>');
    return;
  }
  // return status 400 if email already exists in users object
  if (getUserByEmail(req.body['email'], users) !== null) {
    res.status(400).send('Email already exists\n<button onclick="history.back()">Back</button>');
    return;
  }
  // add user to user database object
  const id = generateRandomString(6);
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
    res.status(403).send('Email cannot be found\n<button onclick="history.back()">Back</button>');
    return;
  }
  // return status 403 if email exists, but password does not match
  if (!bcrypt.compareSync(req.body['password'], user.password)) {
    res.status(403).send('Incorrect password\n<button onclick="history.back()">Back</button>');
    return;
  }
  // set cookie for logged in user
  req.session['user_id'] = user.id;
  res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////
// Route Handlers - PUT
////////////////////////////////////////////////////////////////////////////////

// Update - Edit long URL of existing resource
app.put("/urls/:id", (req, res) => {
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

////////////////////////////////////////////////////////////////////////////////
// Route Handlers - DELETE
////////////////////////////////////////////////////////////////////////////////

// Delete - remove URL from database object
app.delete("/urls/:id", (req, res) => {
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

////////////////////////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////////////////////////
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
