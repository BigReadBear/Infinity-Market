//imort modules
const mongoose = require("mongoose")

// define product schema
const ProductSchema = new mongoose.Schema({
    name:{
        type:String, 
        required:true
    },
    price:{
        type: Number,
        required:true
    },
    owner:{
        type: mongoose.Schema.Types.ObjectId, //set type to reference to db generated id
        ref: 'User'
    }
})

// make a model of the schema and instantiate it 
const Product = mongoose.model('Product',ProductSchema,'products')

// export product
module.exports = Product