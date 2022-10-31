const express = require("express");
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // Default port 8080

app.set("view engine", "ejs");

// parse the body of a POST request (from a 'buffer') to make it human readable
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
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
    password: "dishwasher-funk",
  },
};

/**
 * Function will search users object for given email
 * If email is found, the user (object) will be returned
 * If email is not found, function will return NULL
 */
 const findUserByEmail = function(email) {
  for (const userId in users) {
    // additional filter for object properties:
    if (users.hasOwnProperty(userId)) {
      if (users[userId]['email'] === email ) {
        return users[userId];
      }
    }
  }
  return null;
};

// Create a random string of alphanumeric characters
const generateRandomString = function(nbChars = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < nbChars; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

////////////////////////////////////////////////////////////////////////////////
// Route Handlers - GET
////////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id; // Get the short url
  const longURL = urlDatabase[shortURL];
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const user = req.cookies["user_id"] ? users[req.cookies["user_id"]] : false;
  const templateVars = { user };
  res.render("urls_register", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = req.cookies["user_id"] ? users[req.cookies["user_id"]] : false;
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = req.cookies["user_id"] ? users[req.cookies["user_id"]] : false;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user,
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const user = req.cookies["user_id"] ? users[req.cookies["user_id"]] : false;
  const templateVars = {
    urls: urlDatabase,
    user,
  };
  // console.log('user', user, 'user_id', req.cookies["user_id"]);
  // console.log('users', users);
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

// Create - add new resourse to database object
app.post("/urls", (req, res) => {
  const shortURL = generateRandomString(6); // Generate a new short id
  urlDatabase[shortURL] = req.body['longURL']; // Add key-value pair to database object
  res.redirect(`/urls/${shortURL}`);
});

// Delete - remove resourxe from database object
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id; // Capture the short url to be deleted
  delete urlDatabase[id]; // Delete the resource from the database object
  res.redirect("/urls"); // Redirect to index page to show updated data
});

// Update - modify long URL of existing resource
app.post("/urls/:id/update", (req, res) => {
  const id = req.params.id;
  const newLongURL = req.body.longURL;
  urlDatabase[id] = newLongURL; // Modify the database object
  res.redirect("/urls"); // Redirect to urls page to show updated data
});

// Login - user supplied username
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect("/urls");
});

// Logout - clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

// Register - create new user
app.post("/register", (req, res) => {

  console.log('users before:', users);

  // return status 400 if email or password fields are blank
  if (req.body['email'] === "" || req.body['password'] === "") {
    res.status(400);
    res.send('Please provide an email & password');
    return;
  }
  // return status 400 if email already exists in users object
  if (findUserByEmail(req.body['email']) !== null) {
    res.status(400);
    res.send('Email already exists');
    return;
  }
  // add user to user database object
  const id = generateRandomString(6); // Generate a new (random) user id
  const email = req.body['email'];
  const password = req.body['password'];
  users[id] = {
    id,
    email,
    password,
  };

  console.log('users after:', users);

  res.cookie('user_id', id);
  res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
