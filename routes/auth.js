const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");

function requireLogin(req, res, next) {
  //to make sure the user is logged in
  if (req.session.currentUser) {
    next();
  } else {
    res.redirect("/login");
  }
}

//LOGIN
router.get("/login", (req, res) => {
  res.render("login");
});
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  //check if empty
  if (!username || !password) {
    res.render("login", {
      errorMessage: "Fill username and password",
    });
    return;
  }

  //check if user exists
  const currentUser = await User.findOne({
    username: username,
  });
  if (!currentUser) {
    res.render("login", {
      errorMessage: `${username} does not exist`,
    });
    return;
  }
  //user and pass match
  if (bcrypt.compareSync(password, currentUser.password)) {
    req.session.currentUser = currentUser;
    res.redirect("/home");
  } else {
    //password doesn't match
    res.render("login", {
      errorMessage: `Invalid login`,
    });
    return;
  }
});

//SIGNUP
router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/signup", async (req, res) => {
  const { role, username, name, lastname, gender, password } = req.body;
  //check if empty
  if (username === "" || password === "") {
    res.render("signup", {
      errorMessage: "Fill username and password",
    });
    return;
  }

  // check pass strength - regular expression (can check strength of pass
  //or if email is correct, etc. )
  const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (passwordRegex.test(password) === false) {
    res.render("signup", {
      errorMessage: "Password is too weak",
    });
    return;
  }

  //check if user exists
  const user = await User.findOne({
    username: username,
  });
  //Lembrar de colocar o await sempre que chamar o mongodb
  if (user !== null) {
    res.render("signup", {
      errorMessage: `${username} already exists`,
    });
    return;
  }
  //create user in the database
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(password, salt);
  try {
    await User.create({
      role,
      username,
      name,
      lastname,
      gender,
      password: hashedPassword,
    });
    res.redirect("/login");
  } catch (e) {
    res.render("signup", {
      errorMessage: "error occured, the image cannnot be added",
    });
    return;
  }
});

//logout
router.post("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

//home
router.get("/home", async (req, res) => {
  const userId = req.session.currentUser._id; //get the id of the logged in user
  //console.log("user id", userId); 
  const theUser = await User.findById(userId); //find the user with that id in the database
  //console.log(theUser.role);

  let allUsers;

  if (theUser.role === "coach"){
    allUsers = await User.find({ role: "student" }) //shows users that are students 
    //console.log("all coaches", allUsers)
  } else {
    allUsers = await User.find({ role: "coach" }); //shows users that are coaches
    //console.log("students", allUsers);
    // if its an object(theUser) no need for curly braces
  }
  res.render("home", { allUsers });  //renders the home to access the user information
}); 

router.post("/home/favorites", async (req,res) => {

})

//profile
router.get("/profile/:userId", async (req, res) => {
  const theUser = await User.findById(req.params.userId);
  //console.log("all coaches", allUsers)
  res.render("profile", theUser);
});

module.exports = router;
