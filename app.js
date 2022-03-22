const express = require('express');
const mongoose =  require('mongoose');
const dotenv = require('dotenv');
const cors =require("cors");
const timeout = require("connect-timeout")
const app =  express();


dotenv.config();

app.use(express.json());


//for routing
const feeRoute = require('./routes/fee-route');
app.use('/api', feeRoute);

//base api call
app.get('/', async (req, res) => {
    res.send("Lannister Pay API, Home way")
    //const timeout = require("connect-timeout")
})

//for db connection
mongoose.connect(process.env.DB_CON, { useNewUrlParser: true }, () => {
    console.log(`Successfully to DB`);
  });



//server port
const PORT = process.env.PORT || 3400;

//start seerver
app.listen(PORT, () => {
  `Server running at port : ${PORT}`;
});