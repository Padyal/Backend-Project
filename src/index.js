// require('dotenv').config({path:'./env'})   ----- ok ok version 

import express from 'express'
const PORT = process.env.PORT||9000
import {app} from './app.js'
import dotenv from 'dotenv'
import connetDB from './db/index.js'

dotenv.config({
    path:'./.env'
})

connetDB()
.then(()=>{
    app.listen(PORT , ()=>{
        console.log(`Server is on port : ${PORT}`)
    })
    app.on('error',(error)=>{
        console.log('Error occure in app :',error);
        throw error
    })
})
.catch(
    (err)=>{
        console.log('Mongo DB connection failed',err)
    }
)









/*import express from 'express'
const PORT = process.env.PORT||9000
const app = express()

//()() iife in js envoke function imediatily
// ; -> cleaning pourpose
;( async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        //if we are not able to communicate with db
        app.on("error",(error)=>{
            console.log('Application no able to communicate with DB')
            throw error  
        })

        app.listen(PORT,()=>{
            console.log(`App is listining on PORT:-${PORT}`)
        })
    }catch(error){
        console.log(error)
        throw error
    }
})()
*/


