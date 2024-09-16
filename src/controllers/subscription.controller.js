import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controller to toggle subscription (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const subscriberId = req.user._id;

    // Validate channel ID and subscriber ID
    if (!isValidObjectId(channelId) || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel or subscriber ID");
    }

    // Ensure the user is not subscribing to their own channel
    if (subscriberId.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Check if there is an existing subscription
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channelId,
    });

    if (existingSubscription) {
        // Unsubscribe (remove subscription)
        await existingSubscription.remove();
        return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    } else {
        // Subscribe (create new subscription)
        const newSubscription = new Subscription({
            subscriber: subscriberId,
            channel: channelId,
        });

        await newSubscription.save();
        return res.status(200).json(new ApiResponse(200, newSubscription, "Subscribed successfully"));
    }
});

// Controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    // Validate subscriber ID
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }

    // check if the user(channel) exists
    const channel = await User.findById(subscriberId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }

    // Aggregate to find all subscribers of the given channel and fetch subscriber details
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
        {
            $project: {
                _id: 0,
                subscriberId: "$subscriberDetails._id",
                subscriberName: "$subscriberDetails.fullname",
                subscriberAvatar: "$subscriberDetails.avatar"
            }
        }
    ])

    if (subscribers.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "No subscribers found for this channel"))
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
});


// Controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    // console.log("Channel ID from request params:", channelId);

    // Validate channel ID
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Check if the channel exists
    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Aggregate to find all channels the user has subscribed to and fetch channel details
    const subscriptions = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users", // The name of the User collection
                localField: "channel",
                foreignField: "_id",
                as: "channelDetails",
            },
        },
        {
            $unwind: "$channelDetails",
        },
        {
            $project: {
                _id: 0,
                channelId: "$channelDetails._id",
                channelName: "$channelDetails.username", // Assuming 'username' is the channel name
                channelAvatar: "$channelDetails.avatar", // Assuming 'avatar' is the channel's avatar
            },
        },
    ]);

    if (subscriptions.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No subscribed channels found"));
    }

    return res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully"));
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
};
