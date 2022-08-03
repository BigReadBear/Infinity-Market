//import modules
const express = require('express');
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStore = require('connect-mongo');
const flash= require('connect-flash')

//import routers
const userRouter = require('./routers/User')
const entryRouter = require('./routers/Product')

//create url needed to connect to db (infinity-market)
const url='mongodb+srv://jpomstra:test1234@cluster0.ivxge.mongodb.net/infinity-market?retryWrites=true&w=majority'

//connect to the databse
mongoose.connect(url,{useNewUrlParser:true,useUnifiedTopology:true},(error)=>{
    if(error)
        console.log(error)
    else
        console.log("Connected to DB...")
})

const app = express()   //set app (import express)
const port = 3000   //set port to 3000
app.listen(port)    //open a port at port 3000

app.use(express.urlencoded({extended: true})) // needed to parse requests using req.body
app.use(express.json()) //needed to convert things to json

//create persistent session store on mongoDB with secret key 'topsecretkey'
app.use(session({
    secret:'topsecretkey',
    resave:false,
    saveUninitialized:false,
    store: MongoStore.create({ mongoUrl: url })
}))
app.use(flash()) //use flash, this allows to access the response even though it's been "send". 
 
app.use(userRouter.router) // add user routes
app.use(entryRouter) // add product routes




