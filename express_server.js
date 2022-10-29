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
  "9sm5xK": "http://www.google.com"
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

app.get("/urls/new", (req, res) => {
  const username = req.cookies["username"] ? req.cookies["username"] : false;
  const templateVars = { username };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const username = req.cookies["username"] ? req.cookies["username"] : false;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username
  };
  res.render("urls_show", templateVars);
});

app.get("/urls", (req, res) => {
  const username = req.cookies["username"] ? req.cookies["username"] : false;
  const templateVars = {
    urls: urlDatabase,
    username
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

// Create - add new resourse to database object
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
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

////////////////////////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
