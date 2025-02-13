//get user detail from front end
//validation to check if all inputs are correct - not empty
//check if user already exist - via username or email
//check for images and avatar
//upload them on cloudiary
//create user object in db and get response
//check if response 
//remove password and refresh token field from response
//return response



import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/APIerror.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import {User} from '../models/user.model.js'
import jwt from 'jsonwebtoken'
import {uploadOnCloudinary as cloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import { Subscription } from '../models/subscription.model.js'
import mongoose from 'mongoose'


const generateAccessAndRefreshToken = async (userId)=>{
    try{
        const user = await User.findById(userId)
        const refreshToken = user.generateRefreshToken()
        const accessToken = user.generateAccessToken()

        //save refreshToken in db
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return{accessToken,refreshToken}

    }catch(error){
        throw new ApiError(500,'something went wrong while generating refresh and access token ')
    }
}

const registerUser = asyncHandler(async  (req,res)=>{

    //we get data from html or form 
    const {fullname,username,email,password}=req.body
    //check if all field are given as ip from frontend
    if(fullname==='') {throw new ApiError(400,'fullname is required')}
    if(username==='') {throw new ApiError(400,'username is required')}
    if(email==='') {throw new ApiError(400,'email is required')}
    if(password==='') {throw new ApiError(400,'password is required')}
    
    // const exist = User.findOne({
    //     //we can use or operation in email or username
    //     $or:[{email},{username}]
    // })
    const exist = await User.findOne({email})
    if(exist) {throw new ApiError(409,'User already exist with this username or email')}
    
    //multer give access of files to us

    const avatarLocPath = req.files?.avatar[0]?.path
    //const coverImageLocPath = req.files?.coverimage[0]?.path

    let coverImageLocPath;
    if(req.files && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0){
        coverImageLocPath = req.files.coverimage[0].path
    }

    if(!avatarLocPath){throw new ApiError(400,'avatar is required')}
 
    const avatar = await cloudinary(avatarLocPath)
    const coverImage = await cloudinary(coverImageLocPath)

    if(!avatar){ throw new ApiError(400,'avatar is required')}
    
    const user = await User.create({
        username:username.toLowerCase(),
        email:email,
        password:password,
        fullname:fullname,
        avatar:avatar.url,
        coverimage:coverImage?.url || ''
    })

    if(!user){throw new ApiError(500,'Error in creation of error')}
    
    const createdUser = await User.findById(user._id).select('-password -refreshToken')

    if(!createdUser){throw new ApiError(500,'Something went wrong')}

    return res.status(201).json(
        new ApiResponse( 200,createdUser,'User created successfully')
    )
} )

const loginUser = asyncHandler(async (req,res)=>{
    // req.body ->data
    // check is email and username exist
    // find the user in db
    //check passwrord
    //access and refresh token
    // send this token in cookies 
    // send response

    const {email,username,password} = req.body
    if(!username && !email) {throw new ApiError(400,"username or email is required")}

    const user = await User.findOne({
        $or : [{username},{email}]
    })

    if(!user) {throw new ApiError(404,"User does not exist!!")}

    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect) {throw new ApiError(401,"Invalid user credentials")}

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedUser = await User.findById(user._id).select('-password -refreshToken')

    //by default cookies are modifiable by anyone but when we user httpOnly:true and secure:true cookie are now only modifiable via server only
    const option = {
        httpOnly : true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,option)
    .cookie("refreshToken",refreshToken,option)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedUser,accessToken,refreshToken
            },
            "User logged In successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const option = {
        httpOnly : true,
        secure:true
    }

    return res.status(200).clearCookie("accessToken",option).clearCookie("refreshToken",option)
    .json(new ApiResponse(200,{},"User logged out successfully"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){ throw new ApiError(400,"unauthorized request")}

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){throw new ApiError('401','user not found')}
    
        if(incomingRefreshToken === user?.refreshToken){
            const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
            const option = {
                httpOnly:true,
                secure:true
            }
            return res
            .status(200)
            .cookie("accessToken",accessToken,option)
            .cookie("refreshToken",newRefreshToken,option)
            .json(
                new ApiResponse(200,{
                    accessToken,
                    refreshToken : newRefreshToken
                },"Access token refreshed successfully")
            )
        }else{
            throw new ApiError(401,'You are unauthorized as refresh token dont match')
        }
    } catch (error) {
        throw new ApiError(500,error?.message||'Something went wrong while refreshing token')
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body
    console.log(oldPassword,newPassword)
    // if(newPassword != confirmationPassword){
    //     throw new ApiError(400,"Confire and new password should be same")
    // }
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if(isPasswordCorrect){
        user.password = newPassword
        await user.save({validateBeforeSave : false})
        return res
        .status(200)
        .json(new ApiResponse(200,{},"Password Changed Successfully"))
    }else{
        throw new ApiError(400,"Invalid password!!")
    }

})

const getUser = asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"User fetched successfully"))
})

const updateAccountDetailsTextBased =  asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body

    if(!fullname || !email){
        throw new ApiError('All fields are required')
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                fullname,
                email
            }
        },
        {new :true}
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res)=>{
    const avatarLocalPath = req.file?.path
    if(!avatarLocalPath){
        new ApiError(400,"Avatar is required while updation")
    }
    const avatar = await cloudinary(avatarLocalPath)
    if(!avatar.url){
        new ApiError(400,"Error while uploading on cloudinary during updating Avatar")
    }
    
    await deleteFromCloudinary(avatarLocalPath)

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar : avatar.url 
            },
        },{new:true}
    ).select('-password')
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))
})

const updateUserCoverImage = asyncHandler(async (req,res)=>{
    const coverimageLocalPath = req.file?.path
    if(!coverimageLocalPath){
        new ApiError(400,"CoverImage is required while updation")
    }
    const coverimage = await cloudinary(coverimageLocalPath)
    if(!coverimage.url){
        new ApiError(400,"Error while uploading on cloudinary during updating CoverImage")
    }
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                coverimage:coverimage.url
            },
        },{new:true}
    ).select('-password')
    return res
    .status(200)
    .json(new ApiResponse(200,user,"CoverImage updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,'Username is missing')
    }

    const channel = await User.aggregate([
        {
            $match :{
                username : username?.toLowerCase()
            }
        },{
            $lookup:{
                from :"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from :"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            $addFields:{
                subscriberCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            $project:{
                fullname:1,
                username:1,
                subscriberCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverimage:1,
                email:1,
            }
        }
    ])
    console.log("aggregate pipeline returns this ")
    console.log(channel)

    if(channel?.lenght===0){
        throw  new ApiError(404,"Channel does not exist!!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel feteched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        uername:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first :'$owner'
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully"))
})

export {registerUser, loginUser , logoutUser , refreshAccessToken , changeCurrentPassword , getUser ,updateUserAvatar,updateUserCoverImage,updateAccountDetailsTextBased,getUserChannelProfile,getWatchHistory}