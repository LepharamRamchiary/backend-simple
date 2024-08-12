import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import express from "express";
import 'dotenv/config';

const app = express()
const port = process.env.PORT;
const mongoDB_URL = process.env.MONGODB_URL;









// Immediately-invoked function expression (IIFE)
// basice approch
;( async () => {
    try {
        await mongoose.connect(`${mongoDB_URL}/${DB_NAME}`)
        console.log("db connected to mongo")
        app.on("error", (error) => {
            console.log("db not connect to mongo", error)
            throw error
        })

        app.listen(port, () => {
            console.log(`Server is live on port: ${port}`)
        })
    } catch (error) {
        console.log(error)
        throw error
    }
})()