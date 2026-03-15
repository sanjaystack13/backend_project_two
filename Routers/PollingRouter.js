const express=require('express');
const { 
    getallpolls, updatepoll, deletepoll, getTotalVotes, 
    getTop3Polls, searchPolls, getVotedPolls,
    GETALLPOLLS,
    getwin,
    voteOnPoll,
    likeOnPoll,
    createpoll,
    getPollById,
    getLikedPolls,
    GETALLPOLLS1,
    getmultiplePollById,
    getoptionofvote,
    GETALLPOLLS2,
    getPollsWithIsFollowing,
    getcategorywise
} = require('../Controllers/PollingController');
const router = express.Router();

//Get Total Votes
router.post('/totalvote',getTotalVotes);
// Get top 3 polls
router.get('/top3', getTop3Polls);
// Get All Polls
router.post('/getall', GETALLPOLLS1);

// Get All Polls
// router.post('/getall1', GETALLPOLLS1);GETALLPOLLS2

// Get All Polls
// router.post('/getall1', GETALLPOLLS2);

// Get All Polls
router.post('/getisfollowing', getPollsWithIsFollowing);

// Get by id 
router.post('/getone', getPollById);
// Create a new poll
router.post('/create',createpoll);
// Update a poll  date
router.post('/update', updatepoll);
// Delete a poll  date
router.post('/delete', deletepoll);
// API endpoint to get polls voted by a specific user
router.post('/getvoted',getVotedPolls);
// API endpoint to get polls voted by a specific user
router.post('/getliked',getLikedPolls);
// Search for polls
router.post('/search', searchPolls);

// Update winner for polls
router.post('/getwin', getwin);
// Vote for polls
router.post('/voteonpoll', voteOnPoll);
// Like for polls
router.post('/likeonpoll', likeOnPoll);


router.post('/multipoll', getmultiplePollById);

router.post('/getoption', getoptionofvote);

router.post('/getbycategory', getcategorywise);


module.exports = router;