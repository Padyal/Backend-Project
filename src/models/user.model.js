import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt'

const userSchema = new Schema({
    username:{
        type:String,
        required:[true,'Your username is required!!'],
        unique:true,
        lowercase:true,
        trim:true,
        index:true
    },
    email:{
        type:String,
        required:[true,'Your mail id is required!!!'],
        unique:true,
        lowercase:true,
        trim:true,
    },
    fullname:{
        type:String,
        required:[true,'Full name is required!!!'],
        trim:true,
        index:true
    },
    avatar:{
        type:String, //cloudinary url service
        required:true,
    },
    coverimage:{
        type:String, //cloudinary url service
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video"
        }
    ],
    password:{
        type:String,
        required:[true,'Password is required!!']
    },
    refreshToken:{
        type:String,
    }
},{timestamps:true});


//pre :-this hook runs just before saving data
userSchema.pre("save", async function(next){
    //we check this because we only want to update password when user password is changes and not on any other updates such as avatar pic etc
    if(this.isModified('password')){
    this.password = await bcrypt.hash(this.password,10)
    }
    next()
})


//userSchema methods can be used later on for fucntionality
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        //payload
        {
            _id: this._id,
            email:this.email,
            username:this.username,
            fullname:this.fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        } 
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        //payload
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        } 
    )
}
export const User = mongoose.model("User",userSchema)