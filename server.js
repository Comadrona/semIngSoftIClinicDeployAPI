require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const {logger}=require('./middleware/logger');
const errorHandler=require('./middleware/errorHnadler');
const cookieParser = require('cookie-parser');
const cors=require('cors');
const corsOptions = require('./config/corsOptions');
const PORT = process.env.PORT || 5000;
const cron = require("node-cron");
const emailNotification = require('./nodemailer/notificationEmail');

console.log(process.env.NODE_ENV);


app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());

app.use(cookieParser());
app.use('/',express.static(path.join(__dirname,'public')));

app.use('/', require('./routes/root'));
app.use('/auth',require('./routes/authRoutes'));
//users
app.use('/users',require('./routes/userRoutes'));
//appoiments
app.use('/appoiments',require('./routes/appoimentRoutes'));
//services
app.use('/services',require('./routes/serviceRoutes'));
//clinicalprofile
app.use('/clinicalprofile',require('./routes/clinicalProfileRoutes'));
//ERROR
app.all('*',(req,res)=>{
    res.status(404);
    if(req.accepts('html')){
        res.sendFile(path.join(__dirname,'views','404.html'));
    }else if(req.accepts('json')){
        res.json({message:'404 NOT FOUND'});
    }else{
        res.type('txt').send('404 Not Found');
    }
});
cron.schedule("0 22 * * *", function () {
    emailNotification();
});
app.use(errorHandler);
app.listen(PORT, ()=> console.log("Server running on port "+PORT));
