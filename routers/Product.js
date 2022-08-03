//import all required modules
const express = require('express')
//import models
const Product = require('../models/Product')
const User = require('../models/User')
//import routes 
//(specifically user route, since this will allow us to use the middleware function authenticateUser )
const userRoute = require('./User')
//make this a new router
const router = new express.Router() 

// show all products present in the database
router.get('/products', async (req, res)=>{
    try{
        const result = await Product.find({}) //simply find all products in product collection
        res.send(result) //send result 
    }
    catch(error){
        res.send({error: error}) //if error we send error
    }
})


// add a product (containing name, price and seller) to DB
router.post('/products', userRoute.authenticateUser, async (req, res)=>{
    //read in data from body
    const data = req.body

    try {
        // get user from authenticateUser
        const user = req.user
        // create Product by mongoose schema and add owner (id) as a reference to seller
        const newProduct = new Product({
            name: data.name,
            price: data.price,
            owner: user.id
        })
        //set result as the result of saving new document to DB
        const result = await newProduct.save()
        res.send(result)
    }
    catch(error){
        res.send({error: error}) //if error we send the error
    }
    
})  

// buy a product, body contains the buyer's user name and the productID
router.post('/products/buy', userRoute.authenticateUser, async (req, res)=>{
    try {
        const buyer = req.user //set buyer as current user, from authenticateUSer
        const prod = await Product.findById(req.body.productID) //find product by it's id, obtained from req.body
        //if prod is empty
        if (prod === null) {
            //then we could not find the prodcut, most likely id is wrong 
            res.send({error: "Could not locate product. Please check product id"})
            return //exit out of function
        }

        //next we find the seller by the their user ID, since this is stored in the owner field of the product
        const seller = await User.findById(prod.owner)

        //if seller is empty
        if (seller === null) {
            //then the seller does not exit
            res.send({error: "Seller " + seller.name + " not found"})
            return
        }
        //if the buyer primary key is the same as seller primary key
        if ( buyer.user_name === seller.user_name) {
            //then the buyer already ownes the item
            res.send({error: "Oops, " + buyer.name + " already owns this product"})
            return //exit out of function
        }
        //if the prod.price is more than the buyer balance is
        if (prod.price > buyer.balance) {
            //then the buyer has insufficient funds
            res.send({error: "Oops, " + buyer.name + " has insufficient funds"})
            return
        }
        //if all conditions are met succesfully then we:

        // transfer ownership of product from buyer to seller
        prod.owner = buyer._id

        // substract item price from the balance of buyer
        buyer.balance-=prod.price

        // add the price of the item to seller's balance
        seller.balance+=prod.price

        //call async fucntions to update the info to db
        await buyer.save()
        await seller.save()
        await prod.save()

        //if no errors we send succes message
        res.send({result: "Transaction successful!"})
    } catch (error) {
        //if error we send error
        res.send({error: error})
    }
    
})

// delete product by productID
router.delete('/products/:id', userRoute.authenticateUser, async (req, res)=>{
    try{
        //find prodcut by parsed id in URL
        const prod = await Product.findById(req.params.id)
        //set user as current user obtained from authenticateUser
        const user = req.user
        //if the owner of item is the current user
        if (prod.owner == user.id) {
            // then the owner of this product is currenlty logged in and is allowed to delete  the item 
            const result = await prod.delete() //update to db
            res.send({message: result.name + " was succesfully deleted"}) //send succes message 
        }
        else {
            //if user is nt logged in or owner of the item then send message
            res.send({message: "You are not authorized to perform this operation"})
        }
    }
    catch(error){
        //if error, send error
        res.send({error: error})
    }
}) 

//expert this router
module.exports = router 