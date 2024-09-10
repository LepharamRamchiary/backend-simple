import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    const userId = req.user._id

    if (!content || content.trim().length === 0) {
        throw new ApiError(400, "Tweet content cannot be empty")
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweet = new Tweet({
        owner: user._id,
        content: content.trim()
    })

    await tweet.save()

    res
        .status(200)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.params.userId

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalied user ID")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 })

    if (tweets.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No tweets found"))
    }

    res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
