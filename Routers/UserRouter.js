const express = require("express");
const { createUser, updateUser, deleteUser, getAllUsers, getUserByPhoneOrEmailOrUserName, getProfile, addandremovefollower, profileupload } = require("../Controllers/RegisterController");
const router = express.Router();

router.post('/createuser',createUser);
router.post('/updateuser',updateUser);
router.post('/deleteuser',deleteUser);

router.post('/getone',getUserByPhoneOrEmailOrUserName);

router.get('/getall',getAllUsers);
router.post('/getprofile',getProfile);

router.post('/follow',addandremovefollower);
router.post('/uploadprofile',profileupload);


module.exports =  router;


