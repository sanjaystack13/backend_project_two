const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReplySchema = new Schema({
    poll_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PollCollection' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' },
    reply_msg: { type: String },
    // created_at: { type: Date, default: Date.now },
    likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }],
    replies: [this]
}, { timestamps: true });

const CommentSchema = new Schema({
    poll_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PollCollection' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' },
    comment: { type: String },
    created_at: { type: Date, default: Date.now },
    likers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserCollection' }],
    replies: [ReplySchema]
}, { timestamps: true });


// Middleware to adjust timestamps to IST
CommentSchema.pre('save', function(next) {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const currentIST = new Date(new Date().getTime() + IST_OFFSET);
    this.createdAt = currentIST;
    this.created_at = currentIST;
    this.updatedAt = currentIST;
    next();
});


// Middleware to adjust timestamps to IST
ReplySchema.pre('save', function(next) {
    const IST_OFFSET = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const currentIST = new Date(new Date().getTime() + IST_OFFSET);
    this.createdAt = currentIST;
    this.created_at = currentIST;
    this.updatedAt = currentIST;
    next();
});


const CommentCollection = mongoose.model('CommentCollection', CommentSchema);
module.exports = CommentCollection;
