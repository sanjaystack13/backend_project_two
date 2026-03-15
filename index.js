const express = require('express');
const cors = require('cors');
const bodyparser = require('body-parser');
const port = process.env.port || 5000;
const config = require('./Databases/Db');
const server = express();
const path = require('path')

server.use(cors());
server.use(bodyparser.json());
server.use(express.json());
server.use(express.urlencoded({extended:false}));

const staticauthorprofilePath = path.join(process.cwd(), 'Controllers', 'Authorprofile', 'Image');
server.use('/Authorprofile/Image', express.static(staticauthorprofilePath));
// http://localhost:5000/api/profile/image/logo1_1720177346378.png to view image sample

server.use('/',require('./app'));

server.get('/',(req,res)=>{
    res.send("Server of PollBooth 05 running....!!!");
});

server.listen(port,(req,res)=>{
    console.log(`server is running at ${port}`)
})