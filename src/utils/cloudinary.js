//cloudinary
import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
        //if file path exist
        const res = await cloudinary.uploader.upload(localFilePath,{resource_type:'auto'})
        // remove file from local server as its been uploaded on server
        console.log('File successfully uploaded in cloudinary and url is:',res.url)
        return res
    }catch(error){
        //is file has some error remove it Sync ensure it get conpulsory removed
        fs.unlinkSync(localFilePath)
        return null
    }
} 

export {uploadOnCloudinary}