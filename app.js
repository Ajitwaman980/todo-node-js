const express = require("express");
const cookiesparser = require("cookie-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportlocal = require("passport-local");
const passportmongoose = require("passport-local-mongoose");
const bcrypt = require("bcrypt");
const app = express();

const islogin = async function (req, res, next) {
  if (!req.isAuthenticated()) {
    return res.redirect("/users/login");
  }
  next();
};

//database connections
mongoose
  .connect("mongodb://127.0.0.1:27017/crudoperations", {})
  .then(() => {
    console.log("Connect");
  })
  .catch((err) => {
    consloe.log(err);
  });
// schema
const userschema = new mongoose.Schema({
  fname: {
    type: String,
  },
  lname: {
    type: String,
  },
  age: {
    type: String,
  },
});
const userloginInfo = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
});
userloginInfo.plugin(passportmongoose);
const loginInfo = mongoose.model("UserLoginInfo", userloginInfo);
const user = mongoose.model("Userdata", userschema);

app.use(express.json());
app.use(cookiesparser());
app.use(
  session({
    secret: "blockchain",
    resave: false,
    saveUninitialized: true,
    Cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());
//local used username and password for authentication
passport.use(new passportlocal(loginInfo.authenticate()));

passport.serializeUser(loginInfo.serializeUser());
passport.deserializeUser(loginInfo.deserializeUser());

// authentications new user
app.post("/user/new/signUp", async (req, res) => {
  const { username, password, email } = req.body; //get data
  // console.log(username);
  // check useralredy persent or not
  try {
    const existingUser = await loginInfo.findOne({ email });
    if (existingUser) return res.json({ error: "User already exists" });
    // new signUp user
    const newuser = new loginInfo({ username, email });
    const register = await loginInfo.register(newuser, password); //register usermodel
    console.log(register);
    req.login(register, function (err) {
      if (err) {
        return next(err);
      }
      res.cookie("user", register);
      res.send("welcome your account successfully created");
    });
  } catch (err) {
    console.log("error creating account");
  }
});
// login and logout
app.post(
  "/user/login",
  passport.authenticate("local", {
    failureRedirect: "/",
    failureFlash: true,
  }),
  async (req, res) => {
    res.send("user login success");
  }
);

app.get("/user/logout", islogin, async function (req, res, next) {
  req.logout((err) => {
    if (err) return next();
    res.cookie("user", "a%20");
    res.redirect("/");
  });
});

// routes
app.get("/", async (req, res) => {
  let data = await user.find({});
  res.send(data);
});
// new data
app.post("/api/user/new", async (req, res) => {
  const { fname, lname, age } = req.body;

  try {
    const newUser = new user({ fname, lname, age });
    await newUser.save();
    res.send(newUser);
  } catch (error) {
    consloe.log(error);
  }
});
// edit
app.put("/api/user/:id/edit", async (req, res) => {
  let id = req.params.id;
  const { fname, lname, age } = req.body;
  try {
    const updatedata = await user.findByIdAndUpdate(
      id,
      { fname, lname, age },
      { new: true }
    );
    console.log(id);
    res.send(updatedata);
  } catch (err) {
    console.log(err);
  }
});
// delete
app.delete("/api/user/:id/delete", async (req, res) => {
  try {
    const id = req.params.id;
    const del = await user.findByIdAndDelete(id);
    res.send(del);
  } catch (err) {
    console.log(err);
  }
});

port = 8000;
app.listen(port, () => {
  console.log("server listening on 8000");
});
