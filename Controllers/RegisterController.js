//verified 20/06/2024

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Usermodel = require('../Models/UserModel'); // adjust the path as needed
const Pollmodel = require("../Models/PollingModel");
const multer = require('multer');
const path = require("path");
// Create User
const createUser = async (req, res) => {
    try {
        const { user_name, email, phone_number, password, age, gender } = req.body;
        let query = {}
        //////////////////////////////////////////////
        // if (email && phone_number) {
        //     // Both email and phone_number are provided
        //     query = { $or: [{ email: email }, { phone_number: phone_number }] };
        // } else if (email) {
        //     // Only email is provided
        //     query = { email: email };
        // } else if (phone_number) {
        //     // Only phone_number is provided
        //     query = { phone_number: phone_number };
        // }
        /////////////////////////////////////////////
        if (phone_number || email) {
            query = { $or: [{ email }, { phone_number }], isActive: true };
        }
        console.log(query);

        const existingUser = await Usermodel.findOne(query);

        if (existingUser) {
            return res.status(206).json({ message: "User already exists", existingUser });
        }

        // const hashedPassword = await bcrypt.hash(password, 10);
        // const token = jwt.sign({ phone_number }, process.env.JWT_SECRET_KEY);
        const newUser = new Usermodel({
            user_name,
            email,
            password,
            phone_number,
            age,
            gender
        });

        const savedUser = await newUser.save();
        console.log(savedUser);

        return res.status(201).json({ savedUser });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
// Update User
// const updateUser = async (req, res) => {
//     try {
//         // const { identifier } = req.params; // identifier can be email or phone number
//         const { user_name, email, phone_number, password, identifier } = req.body;

//         const updatedData = {};

//         if (user_name) updatedData.user_name = user_name;
//         if (email) updatedData.email = email;
//         if (phone_number) updatedData.phone_number = phone_number;
//         if (password) updatedData.password = await bcrypt.hash(password, 10);

//         const updatedUser = await Usermodel.findOneAndUpdate(
//             { $or: [ { email: identifier } , { phone_number: identifier }] },
//             updatedData, 
//             { new: true }
//         );

//         if (!updatedUser) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         return res.status(200).json({ updatedUser });
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// };
const updateUser = async (req, res) => {
    try {
        const { user_name, email, user_profile, phone_number, password, identifier, age, gender } = req.body;

        // Check if the new phone number or email already exists for another user
        if (email || phone_number) {
            const query = {
                $or: [{ email }, { phone_number }],
                isActive: true,
                _id: { $ne: req.params.id } // Exclude the current user from the check
            };

            const existingUser = await Usermodel.findOne(query);
            if (existingUser) {
                return res.status(201).json({ message: "Email or phone number already in use by another user" });
            }
        }

        // Prepare the updated data
        const updatedData = {};
        if (user_name) updatedData.user_name = user_name;
        if (email) updatedData.email = email;
        if (phone_number) updatedData.phone_number = phone_number;
        if (age) updatedData.age = age;
        if (gender) updatedData.gender = gender;
        if (password) updatedData.password = password;
        if (user_profile) updatedData.user_profile = user_profile;

        // Update the user in the database
        const updatedUser = await Usermodel.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone_number: identifier }],isActive: true},
            updatedData,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user: updatedUser });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Delete User
// const deleteUser = async (req, res) => {
//     try {
//         // const { identifier } = req.params; // identifier can be email or phone number
//         const { identifier } = req.body; 

//         const deletedUser = await Usermodel.findOneAndDelete(
//             { $or: [{ email: identifier }, { phone_number: identifier }] }
//         );

//         if (!deletedUser) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         return res.status(200).json({ message: "User deleted successfully" });
//     } catch (error) {
//         return res.status(500).json({ message: error.message });
//     }
// };

const deleteUser = async (req, res) => {
    try {
        const { identifier } = req.body;

        const deletedUser = await Usermodel.findOneAndUpdate(
            { $or: [{ email: identifier }, { phone_number: identifier }], isActive: true },
            { $set: { isActive: false } },
            { new: true }
        );
        if (!deletedUser) return res.status(404).json({ message: "User not found" });

        if (deletedUser.created_polls && deletedUser.created_polls.length > 0) {
            const deletePollsResult = await Pollmodel.deleteMany(
                { _id: { $in: deletedUser.created_polls } }
            );
            if (deletePollsResult.deletedCount > 0) {
                return res.status(200).json({ message: "User and polls deleted successfully" });
            }
            else {
                return res.status(200).json({ message: "User deleted successfully, but polls not deleted" });
            }
        }
        else {
            return res.status(200).json({ message: "User deleted successfully, no polls found" });
        }

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
// Get All Users
const getAllUsers = async (req, res) => {
    try {
        const users = await Usermodel.find({ isActive: true });
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
// Get User by Phone Number or Email
const getUserByPhoneOrEmailOrUserName = async (req, res) => {
    try {
        // const { identifier } = req.params; // identifier can be phone number or email
        const { identifier } = req.body; // identifier can be phone number or email
        const user = await Usermodel.findOne({ 
            $or: [{ email: identifier }, { phone_number: identifier }, { user_name: identifier }],
            isActive: true
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
const getProfile = async (req, res) => {
    try {
        const { user_id, current_user } = req.body; // identifier can be phone number or email

        // Find the user and populate the necessary fields
        const user = await Usermodel.findOne({ _id: user_id,isActive: true })
            .populate([
                {
                    path: 'created_polls',
                    model: 'PollCollection',
                    select: '_id created_date poll_id title category question options status isActive expirationTime createdBy likers voters comments',
                    populate: [
                        { path: 'category', model: 'CategoryCollection', select: '_id category_name' },
                        { path: 'createdBy', model: 'UserCollection', select: '_id user_name user_followers' },
                        { path: 'comments', model: 'CommentCollection', select: '_id comment_id poll_id comment likers replies' },
                        { path: 'comments.replies', model: 'CommentCollection', select: '_id reply_id poll_id reply_msg likers' }
                    ]
                },
                {
                    path: 'voted_polls',
                    model: 'PollCollection',
                    select: '_id created_date poll_id title category question options status isActive expirationTime createdBy likers voters comments',
                    populate: [
                        { path: 'category', model: 'CategoryCollection', select: '_id category_name' },
                        { path: 'createdBy', model: 'UserCollection', select: '_id user_name user_followers' },
                        { path: 'comments', model: 'CommentCollection', select: '_id comment_id poll_id comment likers replies' },
                        { path: 'comments.replies', model: 'CommentCollection', select: '_id reply_id poll_id reply_msg likers' }
                    ]
                },
                {
                    path: 'liked_polls',
                    model: 'PollCollection',
                    select: '_id created_date poll_id title category question options status isActive expirationTime createdBy likers voters comments',
                    populate: [
                        { path: 'category', model: 'CategoryCollection', select: '_id category_name' },
                        { path: 'createdBy', model: 'UserCollection', select: '_id user_name user_followers' },
                        { path: 'comments', model: 'CommentCollection', select: '_id comment_id poll_id comment likers replies' },
                        { path: 'comments.replies', model: 'CommentCollection', select: '_id reply_id poll_id reply_msg likers' }
                    ]
                },
                {
                    path: 'commented_polls',
                    model: 'CommentCollection',
                    select: '_id comment_id poll_id comment likers replies',
                    populate: [
                        { path: 'poll_id', model: 'PollCollection', select: '_id createdBy likers voters' },
                        { path: 'replies', model: 'CommentCollection', select: '_id reply_id poll_id reply_msg likers' }
                    ]
                },
                { path: 'user_likers', model: 'UserCollection', select: '_id user_name' },
                { path: 'user_used_category', model: 'CategoryCollection', select: '_id category_id category_name' },
                { path: 'user_followers', model: 'UserCollection', select: '_id user_name' },
                { path: 'user_following', model: 'UserCollection', select: '_id user_name' }
            ]);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Function to process polls and their comments
        const processPolls = async (polls, current_user) => {
            return Promise.all(polls.map(async (poll) => {
                // Determine if the user is following the poll creator
                const isFollowing = poll.createdBy.user_followers?.some(follower => follower.toString() === current_user);

                // Determine if the user has liked the poll
                const isLikedPoll = poll.likers.some(liker => liker._id.toString() === current_user);

                // Determine if the user has voted on the poll
                const isVoted = poll.voters.some(voter => voter._id.toString() === current_user);

                // Process comments and replies to include isLiked status
                const commentsWithLikes = await Promise.all(poll.comments.map(async (comment) => {
                    const isLikedComment = comment.likers.some(liker => liker._id.toString() === current_user);
                    const repliesWithLikes = await Promise.all(comment.replies.map(async (reply) => {
                        const isLikedReply = reply.likers.some(liker => liker._id.toString() === current_user);
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

                // Return the poll with isFollowing, isLiked, isVoted inside user.createdBy
                return {
                    ...poll.toObject(),
                    createdBy: {
                        ...poll.createdBy.toObject(),
                        isFollowing: isFollowing,
                        isLiked: isLikedPoll,
                        isVoted: isVoted
                    },
                    comments: commentsWithLikes
                };
            }));
        };

        // Process all relevant polls for the user
        const processedCreatedPolls = await processPolls(user.created_polls, current_user);
        const processedVotedPolls = await processPolls(user.voted_polls, current_user);
        const processedLikedPolls = await processPolls(user.liked_polls, current_user);

        // Construct the processed user object with updated polls
        const processedUser = {
            ...user.toObject(),
            created_polls: processedCreatedPolls,
            voted_polls: processedVotedPolls,
            liked_polls: processedLikedPolls
        };

        return res.status(200).json({ user: processedUser });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({ message: error.message });
    }
};



const addandremovefollower = async (req, res) => {
    const { follow_user_id, user_id } = req.body;

    try {
        if (follow_user_id == user_id) {
            return res.status(203).json({ message: "Unable to follow yourself" });
        }
        // Retrieve the user by ID
        const user = await Usermodel.findById(follow_user_id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const userIndexInFollowersArray = user.user_followers.indexOf(user_id);

        if (userIndexInFollowersArray !== -1) {
            // If user already follows, remove from followers
            user.user_followers.splice(userIndexInFollowersArray, 1);

            await user.save(); // Save changes
            await Usermodel.findByIdAndUpdate(user_id, {
                $pull: { user_following: follow_user_id }
            });
            return res.status(200).json({ message: 'Follower removed successfully' });
        } else {
            // If user is not following, add to followers
            user.user_followers.push(user_id);

            await user.save(); // Save changes
            await Usermodel.findByIdAndUpdate(user_id, {
                $addToSet: { user_following: follow_user_id }
            });
            return res.status(200).json({ message: 'Follower added successfully' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const profileupload = async (req, res, next) => {
    try {
        let UploadedfileName = '';
        const filePath = path.join(__dirname + '/Authorprofile/Image');
        const Storage = multer.diskStorage({
            destination: filePath,
            filename: (req, file, cb) => {
                const originalname = file.originalname;
                const fileExtension = path.extname(originalname); // Get the file extension
                const uniqueSuffix = Date.now(); // Generate a unique suffix
                const newFilename = path.basename(originalname, fileExtension) + '_' + uniqueSuffix + fileExtension; // Construct the new filename
                UploadedfileName = '/Authorprofile/Image/' + newFilename;
                cb(null, newFilename);
            }
        });
        const upload = multer({ storage: Storage }).single('profile');
        upload(req, res, async function (err) {
            if (err) {
                // Handle upload error
                return res.status(500).send('Error uploading file.' + err);
            }
            res.json({ profile: UploadedfileName }); // Send a JSON response
        });
    }
    catch (error) {
        res.status(500).json({ error: "Error profile Image Upload" + error });
    }
};

module.exports = {
    createUser,
    updateUser,
    deleteUser,
    getAllUsers,
    getUserByPhoneOrEmailOrUserName,
    getProfile,
    addandremovefollower,
    profileupload
};

