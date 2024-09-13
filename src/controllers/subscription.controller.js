import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
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
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}