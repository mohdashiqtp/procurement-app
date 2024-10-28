const mongoose = require("mongoose");
const uri = "mongodb+srv://ashik:ashik@cluster0.m4f5m.mongodb.net/";
require('dotenv').config();

function main() {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, 
        socketTimeoutMS: 45000, 
      }).then(() => {
        console.log("Succesfull")
    }).catch((err) => {
        console.log(process.env.MONGODB_URI)
        console.log("Error: ", err)
    })
}

module.exports = { main };