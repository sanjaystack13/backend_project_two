const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Poll Collection Schema
const pollCollectionSchema = new Schema({
    date: { type: Date},
    poll_id: { type: String, required: true, unique: true },
    question: { type: String, required: true},
    options: [{
        pic: { type: String },
        option: { type: String, required: true },
        count: { type: Number, default: 0 },
        voters:[{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }]
    }],
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    title: { type: String },
    desc: { type: String },
    category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CategoryCollection' }],
    expirationTime: { type: Date }, // Added expiration time field
    winner: { type: String }, // Added winner field to store the winning option
    likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }],
    voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection', required: true },
    total_votes: { type: Number, default: 0 }, // New field for total votes
    total_likes: { type: Number, default: 0 }, // New field for total likes
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CommentCollection' }]
}, 
{ timestamps: true }
);

// Middleware to adjust timestamps to IST
pollCollectionSchema.pre('save', function(next) {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const currentIST = new Date(new Date().getTime() + IST_OFFSET);
    this.createdAt = currentIST;
    this.updatedAt = currentIST;
    next();
});

const PollCollection = mongoose.model('PollCollection', pollCollectionSchema);
module.exports = PollCollection;
