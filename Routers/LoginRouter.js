const express = require("express");
const { loginuser } = require("../Controllers/LoginController");
const router = express.Router();

router.post('/loginuser',loginuser);

module.exports =  router;