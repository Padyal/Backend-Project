// // approach for db connection 
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from 'express'
// const PORT = process.env.PORT||9000
// const app = express()

// //()() iife in js envoke function imediatily
// // ; -> cleaning pourpose
// ;( async()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         //if we are not able to communicate with db
//         app.on("error",(error)=>{
//             console.log('Application no able to communicate with DB')
//             throw error  
//         })

//         app.listen(PORT,()=>{
//             console.log(`App is listining on PORT:-${PORT}`)
//         })
//     }catch(error){
//         console.log(error)
//         throw error
//     }
// })()


