//verified 20/06/2024

const PollCollection = require('../Models/PollingModel')
const CategoryCollection = require('../Models/CategoryModel')
const CommentCollection = require('../Models/CommentsModel')
const UserCollection = require('../Models/UserModel')

// Function to generate a unique poll ID with the format "poll_001"
const generatePollId = async () => {
    // Find the highest poll_id in the database
    const lastPoll = await PollCollection.findOne({}).sort({ poll_id: -1 });
    let newId;
    if (lastPoll) {
        const lastIdNumber = parseInt(lastPoll.poll_id.split('_')[1]);
        newId = 'poll_' + ('000' + (lastIdNumber + 1)).slice(-3);
    } else {
        newId = 'poll_001';
    }
    return newId;
};
// Create a new poll
const createpoll = async (req, res,next) => {
    const {question, options, duration, title, desc, category, createdBy } = req.body;
    try {
        // const verified_user = await UserCollection.findOne({phone_number})
        // if(!verified_user) return res.status(400).json({Message:"Verify Mobile Number to create a poll"});
        const user = await UserCollection.findOne({ _id: createdBy });
        if (!user) {
            return res.status(404).json({ message: "Invalid user" });
        }
        
            const createdAt = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);

            // If no collection for this date exists, create a new one with the poll
            const expirationTime = new Date(createdAt.getTime() + duration * 60 * 60 * 1000);
            const newPollCollection = new PollCollection({
                poll_id: await generatePollId(),
                question,
                options,
                title,
                desc,
                category,
                expirationTime,
                createdBy // Include createdBy field
             });
            const savedPoll= await newPollCollection.save();

            await CategoryCollection.findByIdAndUpdate( category, {
                $push: { category_users :newPollCollection.createdBy  }
            });
    
            await UserCollection.findByIdAndUpdate( createdBy, {
                $push: {  user_used_category :newPollCollection.category  }
            });
    
            await UserCollection.findByIdAndUpdate(createdBy, {
                $push: { created_polls: newPollCollection._id }
            });

            // Populate user and category fields
            const populatedPoll = await PollCollection.findById(savedPoll._id)
            .populate(
            'createdBy', 
            'user_id user_name email phone_number joined_date') // Populate the createdBy field with the name and email of the user
            .populate('category', 'category_id category_name'); // Populate the category field with the name of the category
        
            res.status(201).json(populatedPoll);
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Update a poll by its poll_id without date
const updatepoll = async (req, res,next) => {
    // const {poll_id} = req.params;
    const { question, options, duration, poll_id } = req.body;

    try {
        const createdAt = new Date(new Date().getTime() +5.5 * 60 * 60 * 1000);

            // If no collection for this date exists, create a new one with the poll
        const expirationTime = new Date(createdAt.getTime() + duration * 60 * 60 * 1000);
        const pollToUpdate = await PollCollection.findOne({_id : poll_id});
        if (pollToUpdate) {
            // const pollToUpdate = pollCollection.find(poll => poll.poll_id === poll_id);
            
                pollToUpdate.question = question || pollToUpdate.question;
                pollToUpdate.options = options || pollToUpdate.options;
                pollToUpdate.expirationTime = expirationTime || pollToUpdate.expirationTime;
                await pollToUpdate.save();
                res.json({ message: 'Poll updated successfully' });
            
        } else {
            res.status(404).json({ message: 'No polls found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Delete a poll by its poll_id without date
const deletepoll = async (req, res, next) => {
    // const {poll_id} = req.params;
    const {poll_id} = req.body;

    try {
        const pollCollection = await PollCollection.findOne({_id:poll_id});
        if (pollCollection) {
                await pollCollection.deleteOne();
                res.json({ message: 'Poll deleted successfully' });
                } 
        else {
            res.status(404).json({ message: 'No polls found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Controller function to get total votes
const getTotalVotes = async (req, res) => {
    const { poll_id } = req.body;

    try {
        const poll = await PollCollection.findOne({ _id : poll_id });

        if (!poll) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        const totalVotes = poll.options.reduce((total, option) => total + option.count, 0);

        return res.json({ poll_id, totalVotes });
    } catch (error) {
        console.error('Error fetching poll:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
//Controller function to get Top3 polls
const getTop3Polls = async (req, res) => {
    try {
        const topPolls = await PollCollection.aggregate([
            {
                $project: {
                    _id: 1,
                    poll_id: 1,
                    question: 1,
                    totalVotes: { $sum: '$options.count' },
                    totalLikes: { $size: '$likers' }
                }
            },
            { $sort: { totalVotes: -1 } }, // Sort in descending order based on totalVotes
            { $limit: 3 } // Limit to top 3 polls
        ]);

        return res.status(200).json(topPolls);
    } catch (error) {
        console.log('Error finding top polls:', error);
        return res.status(500).json({ error: 'Internal server error'+ error });
    }
};
//Controller function to search the polls
const searchPolls = async (req, res) => {
    try {
        const { query } = req.body; // Extract query from req.body

        // Validate and sanitize input
        if (typeof query !== 'string' || !query.trim()) {
            return res.status(400).json({ error: 'Invalid query' });
        }

        console.log('Search query:', query.trim()); // Log the sanitized query

        // MongoDB aggregation pipeline to search for polls
        const foundPolls = await PollCollection.aggregate([
            {
                $lookup: {
                    from: 'categorycollections',
                    localField: 'category',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            {
                $unwind: {
                    path: '$categoryInfo',
                    preserveNullAndEmptyArrays: true // Optionally handle documents without categories
                }
            },
            {
                $match: {
                    $or: [
                        { 'categoryInfo.category_name': { $regex: query.trim(), $options: 'i' } },
                        { 'title': { $regex: query.trim(), $options: 'i' } },
                        { 'question': { $regex: query.trim(), $options: 'i' } },
                        { 'poll_id': { $regex: query.trim(), $options: 'i' } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    created_date: 1,
                    poll_id: 1,
                    title: 1,
                    category: {
                        _id: '$categoryInfo._id',
                        category_name: '$categoryInfo.category_name'
                    },
                    question: 1,
                    options: 1,
                    status: 1,
                    isActive: 1,
                    expirationTime: 1,
                    createdBy: 1
                }
            }
        ]);

        return res.status(200).json({ poll_ids: foundPolls });
    } catch (error) {
        console.error('Error searching polls:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
// Controller function to get polls voted by a specific user
const getVotedPolls = async (req, res) => {
    
    const { user_id }= req.body;
    
    try {
      // Find all polls where any element in the voters array matches the userId
      const votedPolls = await PollCollection.find({ voters: { $elemMatch: { $eq: user_id } } });
      
     // Extract poll_id from each poll object
     const pollIds = votedPolls.map(poll => poll._id);
    
     return res.status(200).json({ pollIds });    
    } 
    catch (error) {
      console.error('Error fetching voted polls:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
};
// Controller function to get polls liked by a specific user
const getLikedPolls = async (req, res) => {
    
    const { user_id }= req.body;
    
    try {
      // Find all polls where any element in the voters array matches the userId
      const likedPolls = await PollCollection.find({ likers: { $elemMatch: { $eq: user_id } } });
      
     // Extract poll_id from each poll object
     const pollIds = likedPolls.map(poll => poll._id);
    
     return res.status(200).json({ pollIds });    
    } 
    catch (error) {
      console.error('Error fetching liked polls:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
};

//Controller function to get all the polls
const GETALLPOLLS = async (req, res) => {
    try {
        const polls = await PollCollection.find({})
            .populate({
                path: 'category',
                model: 'CategoryCollection',
                select: '_id category_name' // Only fetch _id and category_name
            })
            .populate({
                path: 'createdBy',
                model: 'UserCollection',
                select: '_id user_name user_profile' // Only fetch _id, user_name, and user_profile
            })
            .populate({
                path: 'likers',
                model: 'UserCollection',
                select: '_id user_name user_type' // Only fetch _id, user_name, and user_type
            })
            .populate({
                path: 'voters',
                model: 'UserCollection',
                select: '_id user_name user_type' // Only fetch _id, user_name, and user_type
            })
            .populate({
                path: 'comments',
                model: 'CommentCollection',
                populate: {
                    path: 'user_id',
                    model: 'UserCollection',
                    select: '_id user_name user_profile' // Only fetch _id and user_name
                }
            }).sort({ 
                status: -1, // 'open' before 'closed'
                createdAt: -1 // Descending order for createdAt within each status
            });
            

        const pollsWithComments = [];

        for (let poll of polls) {
            const comments = await CommentCollection.find({ poll_id: poll._id })
                .populate('user_id', 'user_name')
                .lean();

            const combinedData = {
                _id: poll._id,
                created_date: poll.created_date,
                poll_id: poll.poll_id,
                title: poll.title,
                category: poll.category,
                question: poll.question,
                options: poll.options,
                status: poll.status,
                createdBy: poll.createdBy,
                likers: poll.likers,
                voters: poll.voters,
                isActive: poll.isActive,
                winner: poll.winner,
                expirationTime: poll.expirationTime,
                comments: comments,
                createdAt: poll.createdAt,
                total_likes:poll.total_likes,
                total_votes:poll.total_votes
            };

            pollsWithComments.push(combinedData);
        }

        return res.status(200).json(pollsWithComments);
    } catch (error) {
        console.error('Error fetching polls:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};



// const GETALLPOLLS1 = async (req, res) => {
//     const { user_id } = req.body;
//     try {
//         const polls = await PollCollection.find({})
//             .populate({
//                 path: 'category',
//                 model: 'CategoryCollection',
//                 select: '_id category_name' // Only fetch _id and category_name
//             })
//             .populate({
//                 path: 'createdBy',
//                 model: 'UserCollection',
//                 select: '_id user_name user_profile user_followers' // Fetch _id, user_name, user_profile, and user_followers
//             })
//             .populate({
//                 path: 'likers',
//                 model: 'UserCollection',
//                 select: '_id user_name user_type ' // Only fetch _id, user_name, and user_type
//             })
//             .populate({
//                 path: 'voters',
//                 model: 'UserCollection',
//                 select: '_id user_name user_type' // Only fetch _id, user_name, and user_type
//             })
//             .populate({
//                 path: 'comments',
//                 model: 'CommentCollection',
//                 populate: {
//                     path: 'user_id',
//                     model: 'UserCollection',
//                     select: '_id user_name user_profile' // Only fetch _id and user_name
//                 }
//             })
//             .sort({
//                 status: -1, // 'open' before 'closed'
//                 createdAt: -1 // Descending order for createdAt within each status
//             });
//         const pollsWithComments = [];
//         // Assuming 'polls' is an array of poll objects
// const processedPolls = await Promise.all(polls.map(async (poll) => {
//     // Check if the user is following the poll creator
//     const isFollowing = Array.isArray(poll.createdBy?.userFollowers) && poll.createdBy?.userFollowers.includes(user_id);
//     // const isFollowing = poll.createdBy?.user_followers?.includes(user_id);
//     // Check if the user has liked the poll
//     const isLikedPoll = poll.likers.some(liker => liker._id.toString() === user_id);
//     // Check if the user has voted on the poll
//     const isVoted = poll.voters.some(voter => voter._id.toString() === user_id);
//     // Process comments to include isLiked status
//     const commentsWithLikes = await Promise.all(poll.comments.map(async (comment) => {
//         // Check if the user has liked the comment
//         const isLikedComment = comment.likers.some(liker => liker._id.toString() === user_id);
//         // Process replies to include isLiked status
//         const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => {
//             // Check if the user has liked the reply
//             const isLikedReply = reply.likers.some(liker => liker._id.toString() === user_id);
//             return {
//                 ...reply.toObject(), // Convert reply to plain object
//                 isLiked: isLikedReply // Add isLiked status
//             };
//         }));
//         return {
//             ...comment.toObject(), // Convert comment to plain object
//             isLiked: isLikedComment, // Add isLiked status
//             replies: repliesWithLikes // Include processed replies
//         };
//     }));
//     // Construct combined data object for the current poll
//     const combinedData = {
//         _id: poll._id,
//         created_date: poll.date,
//         poll_id: poll.poll_id,
//         title: poll.title,
//         category: poll.category,
//         question: poll.question,
//         options: poll.options,
//         status: poll.status,
//         createdBy: {
//             _id: poll.createdBy?._id,
//             user_name: poll.createdBy?.user_name,
//             user_profile: poll.createdBy?.user_profile,
//             isFollowing: isFollowing, // Add isFollowing flag
//             isLiked: isLikedPoll, // Add isLiked flag for poll
//             isVoted: isVoted // Add isVoted flag for poll
//         },
//         likers: poll.likers,
//         voters: poll.voters,
//         isActive: poll.isActive,
//         winner: poll.winner,
//         expirationTime: poll.expirationTime,
//         comments: commentsWithLikes,
//         createdAt: poll.createdAt,
//         total_likes: poll.total_likes,
//         total_votes: poll.total_votes
//     };
//     return combinedData;
// }));
//         pollsWithComments.push(processedPolls);
// // processedPolls now contains an array of processed poll objects
//         return res.status(200).json(processedPolls);
//     } catch (error) {
//         console.error('Error fetching polls:', error);
//         return res.status(500).json({ error: 'Internal server error' });
//     }
// };

const GETALLPOLLS1 = async (req, res) => {
    const { user_id } = req.body;
    try {
        const polls = await PollCollection.find({})
            .populate({
                path: 'category',
                model: 'CategoryCollection',
                select: '_id category_name' // Only fetch _id and category_name
            })
            .populate({
                path: 'createdBy',
                model: 'UserCollection',
                select: '_id user_name user_profile user_followers' // Fetch _id, user_name, user_profile, and user_followers
            })
            .populate({
                path: 'likers',
                model: 'UserCollection',
                select: '_id user_name user_type ' // Only fetch _id, user_name, and user_type
            })
            .populate({
                path: 'voters',
                model: 'UserCollection',
                select: '_id user_name user_type' // Only fetch _id, user_name, and user_type
            })
            .populate({
                path: 'comments',
                model: 'CommentCollection',
                populate: {
                    path: 'user_id',
                    model: 'UserCollection',
                    select: '_id user_name user_profile' // Only fetch _id and user_name
                }
            })
            .sort({
                status: -1, // 'open' before 'closed'
                createdAt: -1 // Descending order for createdAt within each status
            });
        const pollsWithComments = [];
        // Assuming 'polls' is an array of poll objects
    const processedPolls = await Promise.all( polls.map( async(poll) => 
        {
            const isFollowing = poll.createdBy.user_followers?.includes(user_id) ? true : false ;
            const isLikedPoll = poll.likers.some(liker => liker._id.toString() === user_id) ? true : false ;
            const isVoted = poll.voters.some(voter => voter._id.toString() === user_id) ? true : false ;

            const commentsWithLikes = await Promise.all(poll.comments.map(async (comment) => 
                {
                const isLikedComment = comment.likers.some(liker => liker._id.toString() === user_id) ? true : false ;
                const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => 
                    {
                        const isLikedReply = reply.likers.some(liker => liker._id.toString() === user_id) ? true : false ;
                         return {
                            ...reply.toObject(), // Convert reply to plain object
                            isLiked: isLikedReply // Add isLiked status
                                };
                    }));
                return {
                 ...comment.toObject(), // Convert comment to plain object
                isLiked: isLikedComment, // Add isLiked status
                replies: repliesWithLikes // Include processed replies
                        };
        }));

        const combinedData = {
        _id: poll._id,
        created_date: poll.date,
        poll_id: poll.poll_id,
        title: poll.title,
        category: poll.category,
        question: poll.question,
        options: poll.options,
        status: poll.status,
        createdBy: {
            _id: poll.createdBy._id,
            user_name: poll.createdBy.user_name,
            user_profile: poll.createdBy.user_profile,
            isFollowing: isFollowing, // Add isFollowing flag
            isLiked: isLikedPoll, // Add isLiked flag for poll
            isVoted: isVoted // Add isVoted flag for poll
        },
        likers: poll.likers,
        voters: poll.voters,
        isActive: poll.isActive,
        winner: poll.winner,
        expirationTime: poll.expirationTime,
        comments: commentsWithLikes,
        createdAt: poll.createdAt,
        total_likes:poll.total_likes,
        total_votes : poll.total_votes
    };
        return combinedData;
        }));
        pollsWithComments.push(processedPolls);
        return res.status(200).json(processedPolls);
    } catch (error) {
        console.error('Error fetching polls:', error);
        return res.json({ error: error.message});
    }
};


const getPollsWithIsFollowing = async (req, res) => {
    const { user_id } = req.body;
    try {
        const polls = await PollCollection.find({},{createdBy:1})
        .populate({path:"createdBy",model:"UserCollection",select:'_id user_name user_followers '})
        const pollsWithIsFollowing = polls.filter(poll => poll.createdBy.user_followers.includes(user_id));
        const pollIds = pollsWithIsFollowing.map(poll => poll._id)
        return res.status(200).json({
            pollIds:pollIds
        });
    } catch (error) {
        console.error('Error fetching polls with isFollowing true:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};


const getoptionofvote = async (req, res) => {
    const { poll_id, user_id } = req.body;
    try {
      const poll = await PollCollection.findById({_id:poll_id});
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }
  
      // Find the option where the user_id is present in the voters array
      let votedOption = null;
      poll.options.forEach((option) => {
        if (option.voters.includes(user_id)) {
          votedOption = option.option;
        }
      });
  
      if (votedOption) {
        return res.status(200).json({ votedOption });
      } else {
        return res.status(404).json({ message: 'User has not voted for this poll' });
      }
    } catch (error) {
      console.error('Error fetching voted option:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
};
  
//Controller function to update the winner
const getwin = async (req, res) => {
    const { poll_id } = req.body;

    try {
        // Find the poll by its ID
        const pollCollection = await PollCollection.findOne({ _id: poll_id });
        // Check if the poll exists
        if (!pollCollection) {
            return res.status(404).json({ error: 'Poll not found' });
        }

        // Calculate total votes and find the option with the highest votes
        let totalVotes = 0;
        let highestCount = 0;
        let winningOptions = [];

        pollCollection.options.forEach(option => {
            totalVotes += option.count;
            if (option.count > highestCount) {
                highestCount = option.count;
                winningOptions = [option.option];
            } else if (option.count === highestCount) {
                winningOptions.push(option.option);
            }
        });

        // Update poll status and determine winner based on expiration time
        const expirationDate = new Date(pollCollection.expirationTime - 19800000);

        const now = Date.now();

        const diffInMs = expirationDate.getTime() - now;

        console.log(diffInMs);

        if (diffInMs < 0 ) {
            pollCollection.status = "closed";
            pollCollection.winner = winningOptions.length > 0 ? winningOptions[0] : "No winner"; 
        } 
            
        else {
            pollCollection.status == "open";
            return res.status(200).json({ Message:"Poll is still open,Cast your vote if you havent",pollCollection });

        }
        // Save updated poll data
        await pollCollection.save();

        // Return response with updated poll data and winner information
        return res.status(200).json({ pollCollection, winner: pollCollection.winner });

    } catch (error) {
        // Handle any errors
        console.error('Error fetching winner:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
//Controller function to vote polls
const voteOnPoll = async (req, res) => {
    try {
        const { poll_id, option, user_id } = req.body;

        // Find the poll by poll_id
        const poll = await PollCollection.findOne({ _id: poll_id });

        // Check if the poll exists
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        // Check if the poll is active
        if (!poll.isActive) {
            return res.status(400).json({ message: 'Poll is not active' });
        }
        if (poll.status === "closed") {
            return res.status(400).json({ message: 'Poll is already ended' });
        }

        // Calculate poll expiration time
        const expirationDate = new Date(poll.expirationTime - 19800000);
        const now = Date.now();
        const diffInMs = expirationDate.getTime() - now;

        // Check if the poll is still open
        if (diffInMs > 0 && poll.status === "open") {
            // Check if the user has already voted
            const hasVoted = poll.voters.some(voterId => String(voterId) === user_id);

            if (hasVoted) {
                // User has already voted, so unvote before voting again
                const votedOption = poll.options.find(opt => opt.voters.includes(user_id));
                if (votedOption) {
                    votedOption.voters.pull(user_id);
                    votedOption.count = votedOption.voters.length;
                }
                
                poll.voters.pull(user_id);
                poll.total_votes=poll.voters?.length;
                await poll.save();
                await UserCollection.findByIdAndUpdate(user_id, {
                    $pull: { voted_polls: poll._id }
                });

                return res.status(200).json({ message: 'Vote removed successfully. Please vote again.' });
            } else {
                // User has not voted yet, so vote now
                const selectedOption = poll.options.find(opt => opt.option === option);
                if (!selectedOption) {
                    return res.status(404).json({ message: 'Option not found for this poll' });
                }

                selectedOption.voters.push(user_id);
                selectedOption.count = selectedOption.voters.length;

                poll.voters.push(user_id);
                poll.total_votes=poll.voters?.length;
                await poll.save();
                await UserCollection.findByIdAndUpdate(user_id, {
                    $addToSet: { voted_polls: poll._id }
                });

                return res.status(200).json({ message: 'Vote recorded successfully.' });
            }
        } else {
            // Poll has expired
            poll.status = "closed";
            await poll.save();
            return res.status(200).json({
                message: 'Poll has expired',
                poll
            });
        }
    } catch (error) {
        console.error('Error voting on poll:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

//Controller function to like polls
const likeOnPoll = async (req, res) => {
    const { poll_id } = req.body;
    const { user_id } = req.body; 
    const user = user_id;
    try {     
        const poll = await PollCollection.findOne({ _id: poll_id });
        if (!poll)   return res.status(404).json({ error: 'Poll not found' });

        const user_Index_in_liker_array = poll.likers.indexOf(user_id);

        if (user_Index_in_liker_array !== -1) {
            // If user already liked the poll, unlike it
            poll.likers.splice(user_Index_in_liker_array, 1);
            poll.total_likes=poll.likers?.length;
            await poll.save();
            await UserCollection.findByIdAndUpdate(user_id, {
                $pull: { liked_polls: poll._id }
            });
            return res.status(200).json({ message: 'Like removed successfully' , Total_likes:poll.total_likes });
        } else {
            // If user hasn't liked the poll, like it
            poll.likers.push(user);
            poll.total_likes=poll.likers?.length;
            await poll.save();

            await UserCollection.findByIdAndUpdate(user_id, {
                $push: { liked_polls: poll._id }
            });
            return res.status(200).json({ message: 'Like recorded successfully' , Total_likes:poll.total_likes});
        }

    } catch (error) {
        console.error('Error liking/unliking poll:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getPollById = async (req, res) => {
    const { poll_id, user_id } = req.body;
    try {
        // Find the poll by poll_id and populate referenced fields
        const poll = await PollCollection.findOne({ _id: poll_id })
            .populate({
                path: 'category',
                model: 'CategoryCollection',
                select: '_id category_name' // Only fetch _id and category_name
            })
            .populate({
                path: 'createdBy',
                model: 'UserCollection',
                select: '_id user_name user_profile user_followers' // Include user_followers for checking if user is following
            })
            .populate({
                path: 'likers',
                model: 'UserCollection',
                select: '_id user_name user_type' // Only fetch _id, user_name, and user_type
            })
            .populate({
                path: 'voters',
                model: 'UserCollection',
                select: '_id user_name user_type' // Only fetch _id, user_name, and user_type
            })
            .populate({
                path: 'comments',
                model: 'CommentCollection',
                populate: {
                    path: 'user_id',
                    model: 'UserCollection',
                    select: '_id user_name user_profile' // Only fetch _id and user_name
                }
            });

        // If poll with given poll_id doesn't exist, return 404
        if (!poll) {
            return res.status(404).json({ message: 'Poll not found' });
        }

        const isFollowing = poll.createdBy.user_followers?.includes(user_id);
        const isLikedPoll = poll.likers.some(liker => liker._id.toString() === user_id);
        const isVoted = poll.voters.some(voter => voter._id.toString() === user_id);

        // Determine if the createdBy user is liked or voted
        // You might need to adjust this based on how 'liking' a user is handled
        const isCreatedByLiked = poll.likers.some(liker => liker._id.toString() === poll.createdBy._id.toString());
        const isCreatedByVoted = poll.voters.some(voter => voter._id.toString() === poll.createdBy._id.toString());

        // Process comments and their replies to include isLiked status
        const commentsWithLikes = await Promise.all(poll.comments.map(async (comment) => {
            const isLikedComment = comment.likers.some(liker => liker._id.toString() === user_id);

            const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => {
                const isLikedReply = reply.likers.some(liker => liker._id.toString() === user_id);
                return {
                    ...reply.toObject(),
                    isLiked: isLikedReply
                };
            }));

            return {
                ...comment.toObject(),
                isLiked: isLikedComment,
                replies: repliesWithLikes
            };
        }));

        // Create an object combining poll data and comments, including interaction statuses
        const pollWithCommentsAndInteractions = {
            _id: poll._id,
            createdAt: poll.createdAt,
            poll_id: poll.poll_id,
            title: poll.title,
            age: poll.age,
            gender: poll.gender,
            category: poll.category,
            question: poll.question,
            options: poll.options,
            status: poll.status,
            createdBy: {
                _id: poll.createdBy._id,
                user_name: poll.createdBy.user_name,
                user_profile: poll.createdBy.user_profile,
                isFollowing: isFollowing, // Include isFollowing status
                isLiked: isCreatedByLiked, // Include isLiked status for createdBy
                isVoted: isCreatedByVoted // Include isVoted status for createdBy
            },
            likers: poll.likers,
            voters: poll.voters,
            isActive: poll.isActive,
            winner: poll.winner,
            expirationTime: poll.expirationTime,
            comments: commentsWithLikes,
            total_likes:poll.total_likes,
            total_votes:poll.total_votes
            // isLiked: isLikedPoll, // Add isLiked flag for poll
            // isVoted: isVoted // Add isVoted flag for poll
        };

        // Return the poll object with interaction statuses as JSON response
        return res.json(pollWithCommentsAndInteractions);
    } catch (error) {
        // Handle errors and return an error response
        console.error('Error fetching poll by ID:', error);
        return res.json({Err: 'Internal server error'});
        return res.json(error);
        //  res.status(500).json({ error: 'Internal server error' });
    }
};

const getmultiplePollById = async (req, res) => {
    const { poll_ids, user_id } = req.body; // Expect an array of poll_id objects and user_id
    try {
        // Extract _id values from poll_ids array
        const ids = poll_ids.map(obj => obj._id);

        // Fetch polls by an array of poll_ids
        const polls = await PollCollection.find({ _id: { $in: ids } })
            .populate({
                path: 'category',
                model: 'CategoryCollection',
                select: '_id category_name'
            })
            .populate({
                path: 'createdBy',
                model: 'UserCollection',
                select: '_id user_name user_profile user_followers'
            })
            .populate({
                path: 'likers',
                model: 'UserCollection',
                select: '_id user_name user_type'
            })
            .populate({
                path: 'voters',
                model: 'UserCollection',
                select: '_id user_name user_type'
            })
            .populate({
                path: 'comments',
                model: 'CommentCollection',
                populate: {
                    path: 'user_id',
                    model: 'UserCollection',
                    select: '_id user_name user_profile'
                }
            });

        // If no polls are found, return 404
        if (!polls.length) {
            return res.status(404).json({ message: 'Polls not found' });
        }

        // Process polls to add user-specific data
        const processedPolls = await Promise.all(polls.map(async (poll) => {
            const isFollowing = poll.createdBy.user_followers?.includes(user_id);
            const isLikedPoll = poll.likers.some(liker => liker._id.toString() == user_id);
            const isVoted = poll.voters.some(voter => voter._id.toString() == user_id);

            // Process comments and their replies to include isLiked status
            const commentsWithLikes = await Promise.all(poll.comments.map(async (comment) => {
                const isLikedComment = comment.likers.some(liker => liker._id.toString() == user_id);

                const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => {
                    const isLikedReply = reply.likers.some(liker => liker._id.toString() == user_id);
                    return {
                        ...reply.toObject(),
                        isLiked: isLikedReply
                    };
                }));

                return {
                    ...comment.toObject(),
                    isLiked: isLikedComment,
                    replies: repliesWithLikes
                };
            }));

            return {
                _id: poll._id,
                createdAt: poll.createdAt,
                poll_id: poll.poll_id,
                title: poll.title,
                age: poll.age,
                gender: poll.gender,
                category: poll.category,
                question: poll.question,
                options: poll.options,
                status: poll.status,
                createdBy: {
                    _id: poll.createdBy._id,
                    user_name: poll.createdBy.user_name,
                    user_profile: poll.createdBy.user_profile,
                    isFollowing: isFollowing, // Add isFollowing flag
                    isLiked: isLikedPoll, // Add isLiked flag for poll
                    isVoted: isVoted // Add isVoted flag for poll
                },
                likers: poll.likers,
                voters: poll.voters,
                isActive: poll.isActive,
                winner: poll.winner,
                expirationTime: poll.expirationTime,
                comments: commentsWithLikes,
               
            };
        }));

        // Return the array of processed polls as JSON response
        return res.status(200).json(processedPolls);

    } catch (error) {
        // Handle errors and return an error response
        console.error('Error fetching polls by IDs:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const getcategorywise = async (req, res) => {
        const { category, user_id } = req.body;  // Correct way to access req.body
        try {
            const polls = await PollCollection.find({category})
                .populate({
                    path: 'category',
                    model: 'CategoryCollection',
                    select: '_id category_name' // Only fetch _id and category_name
                })
                .populate({
                    path: 'createdBy',
                    model: 'UserCollection',
                    select: '_id user_name user_profile user_followers' // Fetch _id, user_name, user_profile, and user_followers
                })
                .populate({
                    path: 'likers',
                    model: 'UserCollection',
                    select: '_id user_name user_type ' // Only fetch _id, user_name, and user_type
                })
                .populate({
                    path: 'voters',
                    model: 'UserCollection',
                    select: '_id user_name user_type' // Only fetch _id, user_name, and user_type
                })
                .populate({
                    path: 'comments',
                    model: 'CommentCollection',
                    populate: {
                        path: 'user_id',
                        model: 'UserCollection',
                        select: '_id user_name user_profile' // Only fetch _id and user_name
                    }
                })
                .sort({
                    status: -1, // 'open' before 'closed'
                    createdAt: -1 // Descending order for createdAt within each status
                });
            const pollsWithComments = [];
            // Assuming 'polls' is an array of poll objects
        const processedPolls = await Promise.all( polls.map( async(poll) => 
            {
                const isFollowing = poll.createdBy.user_followers?.includes(user_id) ? true : false ;
                const isLikedPoll = poll.likers.some(liker => liker._id.toString() === user_id) ? true : false ;
                const isVoted = poll.voters.some(voter => voter._id.toString() === user_id) ? true : false ;
    
                const commentsWithLikes = await Promise.all(poll.comments.map(async (comment) => 
                    {
                    const isLikedComment = comment.likers.some(liker => liker._id.toString() === user_id) ? true : false ;
                    const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => 
                        {
                            const isLikedReply = reply.likers.some(liker => liker._id.toString() === user_id) ? true : false ;
                             return {
                                ...reply.toObject(), // Convert reply to plain object
                                isLiked: isLikedReply // Add isLiked status
                                    };
                        }));
                    return {
                     ...comment.toObject(), // Convert comment to plain object
                    isLiked: isLikedComment, // Add isLiked status
                    replies: repliesWithLikes // Include processed replies
                            };
            }));
    
            const combinedData = {
            _id: poll._id,
            created_date: poll.date,
            poll_id: poll.poll_id,
            title: poll.title,
            category: poll.category,
            question: poll.question,
            options: poll.options,
            status: poll.status,
            createdBy: {
                _id: poll.createdBy._id,
                user_name: poll.createdBy.user_name,
                user_profile: poll.createdBy.user_profile,
                isFollowing: isFollowing, // Add isFollowing flag
                isLiked: isLikedPoll, // Add isLiked flag for poll
                isVoted: isVoted // Add isVoted flag for poll
            },
            likers: poll.likers,
            voters: poll.voters,
            isActive: poll.isActive,
            winner: poll.winner,
            expirationTime: poll.expirationTime,
            comments: commentsWithLikes,
            createdAt: poll.createdAt,
            total_likes:poll.total_likes,
            total_votes : poll.total_votes
        };
            return combinedData;
            }));
            pollsWithComments.push(processedPolls);
            return res.status(200).json(processedPolls);
    } catch (error) {
      console.error('Error fetching polls by category:', error);
      res.status(500).json({ error: 'Failed to fetch polls' });  // Send error response with status 500
    }
  };

module.exports = {
    searchPolls,
    getVotedPolls,
    getLikedPolls,

    createpoll,
    updatepoll,
    deletepoll,
    getTotalVotes,
    getTop3Polls,

    getPollById,
    GETALLPOLLS,
    getwin,
    voteOnPoll,
    likeOnPoll,


    GETALLPOLLS1,
    getmultiplePollById,
    getoptionofvote,
    getPollsWithIsFollowing,

    getcategorywise
    // GETALLPOLLS2
};
