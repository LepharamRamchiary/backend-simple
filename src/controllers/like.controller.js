import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

//helper function for like 
const createLike = async (userId, targetId, targetType) => {
    const existingLike = await Like.findOne({
        [targetType]: targetId,
        likedBy: userId
    })

    if (existingLike) {
        await existingLike.romove()
        return { message: "Like removed", action: "dislike" }
    } else {
        const newLike = new Like({
            [targetType]: targetId,
            likedBy: userId
        })
        await newLike.save()
        return { message: "Like Successfully", action: "like" }
    }
}

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: toggle like on video
    const userId = req.user._id

    // validation
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const result = await createLike(userId, videoId, "video")
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Like successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    //TODO: toggle like on comment
    const userId = req.user._id

    // validation
    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Comment ID is invalid")
    }

    const result = await createLike(userId, commentId, "comment")
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comment is liked sucessfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id

    // validation
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "tweet ID is invalid")
    }

    const result = await createLike(userId, tweetId, "tweet")
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Tweet is liked successfully"))

}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    const likedVideo = await Like.find({
        likedBy: userId,
        video: {
            $exists: true
        }
    })

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideo, "Liked video fetch successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}