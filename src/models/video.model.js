import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile:{
        //cloudnary url
        type:String,
        required:[true,'Video is not available']
    },
    thumbnail:{
        //cloudnary url
        type:String,
        required:[true,'Thumbnail is not available']
    },
    title:{
        type:String,
        required:[true,'Title is not available']
    },
    description:{
        type:String,
        required:[true,'Discription is not available']
    },
    duration:{
        type:Number,
        required:[true,'Discription is not available'] //cloudnary url
    },
    view:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model('Video',videoSchema)