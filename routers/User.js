//import modules
const express = require('express')
const User = require('../models/User')
const bcrypt = require('bcrypt')

//create new router
const router = new express.Router()

//middleware function to authenticate a user
const authenticateUser = async (req, res, next) => {
    //if there is no session id
    if (!req.session.user_id) {
        //then the user is not logged in, so we restrict access
        res.send({ Message: "This page requires you to be logged in" })
        return //exit out of function
    }
    //else we try to:
    try {
        //find current user by their ID and save it as user
        const user = await User.findById(req.session.user_id)
        req.user = user //return the user to fucntion that called this middleware funct
        next() //continue
    } catch (error) {
        //if error we send the error
        res.send({ error: error })
    }
}

//add a user to the database
router.post('/users/register', async (req, res) => {

    //create a new user, use parsed info 
    const user = new User({ ...req.body })

    try {
        user.password = await bcrypt.hash(user.password, 8) //hash the provided password 
        const result = await user.save() //save user to database
        result.password = undefined //set password to undefined before we send it, so password is not shown
        res.send(result) //send the user object
        //set session id to the id of the user, since I think it's logical that you don't have to log in again after you have just created your account.
        req.session.user_id = result.id
    }
    catch (error) {
        //if error we send the error
        res.send({ error: error })
    }
})

//log in to existing account
router.post('/users/login', async (req, res) => {

    //set username and password to data parsed from the req body
    let username = req.body.user_name
    let password = req.body.password

    try {
        //find user by their username
        const user = await User.findOne({ user_name: username })
        //if user is returned not empty (user is found)
        if (user !== null) {
            //then we compare the parsed pw with our hashed stored password
            const result = await bcrypt.compare(password, user.password)
            //if result is true
            if (result) {
                //we set the session.user_id to the user id of the user
                req.session.user_id = user._id
                res.send({ message: "Successfully logged in. Welcome " + user.name }) //send succes message
            } else
                // user exists but wrong password 
                res.send({ message: "Error logging in. Incorrect username/password" })
        } else {
            // user does not exists
            res.send({ message: "Error logging in. Incorrect username/password" })
        }
    }
    catch (error) {
        //user is probably null, not found
        res.send({ error: "Error logging in. Incorrect username/password" })
    }
})

//show a user by the user name and show the items this user posseses
router.get('/users/me', authenticateUser, async (req, res) => {
    try {
        req.user.password = undefined // wipe password from req so we dont send this
        const result = await req.user.populate('items') // populate items
        res.send(result) //send the result
    }
    catch (error) {
        //if error we send the error
        res.send({ error: error })
    }
})

//loggin out
router.post('/users/logout', authenticateUser, (req, res) => {
    //get user from authenticateUser
    const user = req.user
    req.session.destroy() //destroy current session 
    res.send({ Message: "Successfully logged out " + user.name }) //send succes message
})


//delete a specific user
router.delete('/users/me', authenticateUser, async (req, res) => {
    //get user from authenticateUser
    const user = req.user

    //delete user, but excecute the helper function pre first to empty their list of items
    try {
        await user.deleteOne() //delete the user
        req.session.destroy()  //destroy the session (so user is logged out)
        res.send({ Message: "Successfully deleted " + user.name }) //send succes message
    } catch (error) {
        //if error we send error
        res.send({ error: error })
    }
})

//show all users with their items
router.get('/summary', async (req, res) => {
    try {
        // find all users and populate their items list
        const result = await User.find({}).populate('items')
        res.send(result) //send the result
    }
    catch (error) {
        //if error we send the error
        res.send({ error: error }) 
    }
})

//export this route and the middleware function
module.exports = {
    router,
    authenticateUser
}