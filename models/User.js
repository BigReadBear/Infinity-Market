//import modules
const mongoose = require('mongoose')
const Product = require('./Product') //import product model

// define an user schema, with name(string, required), username(string, required and must be unique),
//password (String, required) and a balance(Number, default: 100)
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    user_name: {
        type: String,
        required: true,
        unique: true, //username must be unique
    },
    password: {
        type: String,
        required: true,
    },
    balance: {
        type: Number,
        default: 100, //set default value of balance to a 100
    },
})

// create a virtual list of items owned by this user 
UserSchema.virtual('items',{
    ref:'Product',
    localField:'_id',
    foreignField:'owner'    
})

//set schema to an object and to JSON
UserSchema.set('toJSON',{virtuals: true})
UserSchema.set('toObject', {  virtuals: true });

// create an instance (model) of the UserSchema
const User = mongoose.model('User',UserSchema, 'Users')

// this makes sure that whenever a user is deleted, first all their products are deleted
UserSchema.pre('deleteOne', {document: true}, function(next){
    Product.deleteMany({owner:this._id},(error,result)=>{
        next() 
    })
})


// export the User instance
module.exports = User