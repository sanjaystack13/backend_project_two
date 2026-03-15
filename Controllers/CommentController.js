//verified 20/06/2024
const CommentCollection = require('../Models/CommentsModel'); // Adjust the path as needed
const PollCollection = require('../Models/PollingModel');
const UserCollection = require('../Models/UserModel');

const createComment = async (req, res) => {
    try {
        const { poll_id, user_id, comment } = req.body;

        const newComment = new CommentCollection({  poll_id, user_id, comment });
        await newComment.save();
        await PollCollection.findByIdAndUpdate(poll_id, {
            $push: { comments : newComment._id }
        });
        await UserCollection.findByIdAndUpdate(user_id, {
            $push: { commented_polls : newComment._id }
        });
        
        return res.status(201).json({ 
            comment: newComment,
            message: "Comment created successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const createReply = async (req, res) => {
    try {
        // const { comment_id } = req.params;
        const { poll_id, user_id, reply_msg, comment_id } = req.body;
        const comment = await CommentCollection.findOne({_id : comment_id });
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        // const reply_id = await generateReplyID(comment);
        const newReply = { poll_id, user_id, reply_msg };
        comment.replies.push(newReply);
        lastreply = comment.replies[comment.replies.length-1];
        
        await comment.save();
        return res.status(201).json({ 
            reply: newReply,
            _id:lastreply._id,
            message: "Reply added successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// const createReply = async (req, res) => {
//     try {
//       const { poll_id, user_id, reply_msg, comment_id, parent_reply_id } = req.body;
//       const comment = await CommentCollection.findOne({ _id: comment_id });
  
//       if (!comment) {
//         return res.status(404).json({ message: 'Comment not found' });
//       }
  
//       let parentReply = null;
  
//       if (parent_reply_id) {
//         parentReply = comment.replies.id(parent_reply_id);
//         if (!parentReply) {
//           return res.status(404).json({ message: 'Parent reply not found' });
//         }
//       }
  
//       const newReply = {
//         poll_id,
//         user_id,
//         reply_msg,
//         parent_reply_id: parentReply ? parentReply._id : null
//       };
  
//       if (parentReply) {
//         parentReply.replies.push(newReply);
//       } else {
//         comment.replies.push(newReply);
//       }
  
//       await comment.save();
  
//       return res.status(201).json({ 
//         reply: newReply,
//         message: "Reply added successfully"
//       });
//     } catch (error) {
//       return res.status(500).json({ message: error.message });
//     }
//   };

// const likeComment = async (req, res) => {
//     try {
//         // const { comment_id } = req.params;
//         const { user_id, comment_id } = req.body;
//         const comment = await CommentCollection.findOne({ _id:comment_id });
//         const user_Index_in_liker_array = comment.likers.indexOf(user_id);

//         if (!comment) {
//             return res.status(404).json({ message: 'Comment not found' });
//         }
//         if (!comment.likers.includes(user_id)) {
//             comment.likers.push(user_id);
//             await comment.save();
//             return res.status(200).json({ 
//             message: "Comment liked successfully",
//             comment
//         })
//         }
//             if (user_Index_in_liker_array!== -1){
//             comment.likers.splice(user_Index_in_liker_array, 1);
//             await comment.save();
//             return res.status(200).json({ 
//             message: "Like removed successfully",
//             comment
//         })
//         }
        
        
//     } catch (error) {
//         console.log(error);

//         return res.status(500).json({ message: error.message });
//     }
// };
const likeComment = async (req, res) => {
    try {
        const { user_id, comment_id } = req.body;
        const comment = await CommentCollection.findById({_id:comment_id});
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        const userIndexInLikerArray = comment.likers.indexOf(user_id);

        if (userIndexInLikerArray === -1) {
            // User has not liked the comment yet
            comment.likers.push(user_id);
            await comment.save();
            return res.status(200).json({ 
                message: "Comment liked successfully",
                comment
            });
        } else {
            // User has already liked the comment, so remove the like
            comment.likers.splice(userIndexInLikerArray, 1);
            await comment.save();
            return res.status(200).json({ 
                message: "Like removed successfully",
                comment
            });
        }
    } catch (error) {
        console.error('Error toggling like on comment:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const likeReply = async (req, res) => {
    try {
        // const { comment_id, reply_id } = req.params;
        const { user_id, comment_id, reply_id } = req.body;
        const comment = await CommentCollection.findOne({ _id : comment_id });
        
        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }
        const reply = comment.replies.id(reply_id);
        
        const user_Index_in_liker_array = reply.likers.indexOf(user_id);

        if (!reply) {
            return res.status(404).json({ message: 'Reply not found' });
        }

        if (!reply.likers.includes(user_id)) {
            reply.likers.push(user_id);
            await comment.save();
            return res.status(200).json({ 
                message: "Reply liked successfully",
                reply
            });
        }

        if (user_Index_in_liker_array!== -1){
            reply.likers.splice(user_Index_in_liker_array, 1);
            await comment.save();
            return res.status(200).json({ 
            message: "Like removed successfully",
            reply   
            
        })
        }
       
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// const getCommentsByPollId = async (req, res) => {
//     try {
//         // const { poll_id } = req.params;
//         const { poll_id } = req.body;

//         // Query comments using Mongoose
//         const comments = await CommentCollection.find({ poll_id })
//         .populate([
//             { path: 'user_id', model: 'UserCollection', select: 'user_name' },
//             { path: 'replies.user_id', model: 'UserCollection', select: 'user_name' }
//         ]);

//         // Check if comments exist for the given poll_id
//         if (!comments || comments.length === 0) {
//             return res.status(404).json({ message: 'No comments found for this poll_id' });
//         }

//         // Return comments found
//         return res.status(200).json(comments);
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// };

// const getCommentsByPollId = async (req, res) =>{
//     try {
//         const { poll_id, user_id } = req.body; // Ensure user_id is included in the request body
//         // Query comments using Mongoose
//         const comments = await CommentCollection.find({ poll_id })
//             .populate([
//                 { path: 'user_id', model: 'UserCollection', select: 'user_name' },
//                 { path: 'replies.user_id', model: 'UserCollection', select: 'user_name' },
//                 { path: 'likers', model: 'UserCollection', select: '_id user_name user_type' } // Populate likers field
//             ]);
//         // Process comments to include isLiked status
//         const commentsWithLikes = await Promise.all(comments.map(async (comment) => {
//             // Check if the user has liked the comment
//             const isLikedComment = comment.likers.some(liker => liker._id.toString() === user_id);
//             // Process replies to include isLiked status
//             const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => {
//                 // Check if the user has liked the reply
//                 const isLikedReply = reply.likers.some(liker => liker._id.toString() === user_id);
//                 return {
//                     ...reply.toObject(), // Convert reply to plain object
//                     isLiked: isLikedReply // Add isLiked status
//                 };
//             }));
//             return {
//                 ...comment.toObject(), // Convert comment to plain object
//                 isLiked: isLikedComment, // Add isLiked status
//                 replies: repliesWithLikes // Include processed replies
//             };
//         }));
//         // Check if comments exist for the given poll_id
//         if (!comments || comments.length === 0) {
//             return res.status(404).json({ message: 'No comments found for this poll_id' });
//         }
//         // Return comments found
//         return res.status(200).json(commentsWithLikes);
//     }
//     catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'An error occurred while retrieving comments' });
//     }
//     }

const getCommentsByPollId = async (req, res) => {
    try {
        const { poll_id, user_id } = req.body; // Ensure user_id is included in the request body

        // Query comments using Mongoose
        const comments = await CommentCollection.find({ poll_id })
            .populate([
                { path: 'user_id', model: 'UserCollection', select: 'user_name user_profile' },
                { path: 'replies.user_id', model: 'UserCollection', select: 'user_name user_profile' },
                { path: 'likers', model: 'UserCollection', select: '_id user_name user_type user_profile' } // Populate likers field
            ]);

        // Process comments to include isLiked status
        const commentsWithLikes = await Promise.all(comments.map(async (comment) => {
            // Check if the user has liked the comment
            const isLikedComment = comment.likers.some(liker => liker._id.toString() === user_id);

            // Process replies to include isLiked status and sort them
            const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => {
                // Check if the user has liked the reply
                const isLikedReply = reply.likers.some(liker => liker._id.toString() === user_id);
                return {
                    ...reply.toObject(), // Convert reply to plain object
                    isLiked: isLikedReply // Add isLiked status
                };
            }));

            // Sort replies to place those by user_id first
            const sortedReplies = repliesWithLikes.sort((a, b) => {
                return a.user_id.toString() === user_id ? -1 : b.user_id.toString() === user_id ? 1 : 0;
            });

            return {
                ...comment.toObject(), // Convert comment to plain object
                isLiked: isLikedComment, // Add isLiked status
                replies: sortedReplies // Include sorted replies
            };
        }));

        // Sort comments to place those by user_id first
        const sortedComments = commentsWithLikes.sort((a, b) => {
            return a.user_id._id.toString() === user_id ? -1 : b.user_id._id.toString() === user_id ? 1 : 0;
        });

        // Check if comments exist for the given poll_id
        if (!sortedComments || sortedComments.length === 0) {
            return res.status(200).json({ message: 'No comments found for this poll_id' });
        }

        // Return sorted comments found
        return res.status(200).json(sortedComments);
    } catch (error) {
        console.error('Error while retrieving comments:', error);
        return res.status(500).json({ message: 'An error occurred while retrieving comments' });
    }
};

    
const getLikedComments = async (req, res) => {
    
    const { user_id }= req.body;
    
    try {
      // Find all polls where any element in the voters array matches the userId
      const likedComments = await CommentCollection.find({ likers: { $elemMatch: { $eq: user_id } } });
      
     // Extract poll_id from each poll object
     const commentIds = likedComments.map(comment => comment._id);
    
     return res.status(200).json({ commentIds });    
    } 
    catch (error) {
      console.error('Error fetching liked comments:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getLikedReplies = async (req, res) => {
    const { user_id } = req.body;

    try {
        // Find all comments containing replies with the user_id in their likers array
        const likedComments = await CommentCollection.find({
            "replies.likers": user_id
        });

        // Extract reply IDs where the user is in the likers array
        const replyIds = likedComments.flatMap(comment =>
            comment.replies
                .filter(reply => reply.likers.includes(user_id))
                .map(reply => reply._id)
        );

        return res.status(200).json({ replyIds });
    } catch (error) {
        console.error('Error fetching liked replies:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports = {
    createComment,
    createReply,
    likeComment,
    likeReply,
    getCommentsByPollId,

    getLikedComments,
    getLikedReplies
};
