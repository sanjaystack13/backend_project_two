const mongoose = require('mongoose');

const Userschema = new mongoose.Schema({
    // user_id: { type: String },
    user_name: { type: String },
    user_profile:{ type: String },
    age: { type: Date },
    gender: { type: String, 
        // enum: ['male', 'female', 'others'] 
    },
    user_type: { type: String, enum: ['self', 'business', 'community'], default: 'self' },
    email: { type: String },
    bio: { type: String },
    phone_number: { type: String},
    password: { type: String },
    token: { type: String },
    googleID: { type: String },
    user_used_category:[{ type: mongoose.Schema.Types.ObjectId, ref: 'CategoryCollection' }],
    created_polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PollCollection' }],
    voted_polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PollCollection' }],
    liked_polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PollCollection' }],
    commented_polls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PollCollection' }],
    joined_date: { type: Date, default: Date.now },
    user_likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }],
    user_followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }],
    user_following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }],
    isActive: { type: Boolean, default: true },
}, 
{ timestamps: true }
);

Userschema.pre('save', function(next) {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const currentIST = new Date(new Date().getTime() + IST_OFFSET);
    this.joined_date = currentIST;
    this.createdAt = currentIST;
    this.updatedAt = currentIST;
    next();
});

module.exports = mongoose.model('UserCollection',Userschema);