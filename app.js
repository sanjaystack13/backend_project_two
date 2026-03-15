const express =  require('express');
const app = express();

app.use('/api',require('./Routers/UserRouter'));
app.use('/log',require('./Routers/LoginRouter'));
app.use('/auth',require('./Routers/GoogleRouter'));
app.use('/emailauth',require('./Middlewares/Email'));
app.use('/mobileauth',require('./Middlewares/Mobile'));
app.use('/polls',require('./Routers/PollingRouter'));
app.use('/category',require('./Routers/CategoryRouter'));
app.use('/comment',require('./Routers/CommentRouter'));


module.exports = app;