import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
})) //<-use for all middle wares

//configuration , middlewares
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:'16kb'}))
app.use(express.static('public'))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.route.js' 

//routes declaration
//url will be like //https://localhost:8000/api/v1/users
//we will use this router that we wrote in other file as a middleware therefore we need app.use()
app.use("/api/v1/users",userRouter)

export {app}