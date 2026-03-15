const express = require('express');
const { createComment, createReply, likeComment, likeReply, getCommentsByPollId, getLikedComments, getLikedReplies } = require('../Controllers/CommentController');
const router = express.Router();

router.post('/createcomment',createComment);
router.post('/replycomment', createReply);
router.post('/likecomment',likeComment);
router.post('/likereply',likeReply);
router.post('/getbyid',getCommentsByPollId);


router.post('/getcommentslikedbyuser',getLikedComments);
router.post('/getreplieslikedbyuser',getLikedReplies);

module.exports = router;
