import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//json data 
app.use(express.json({limit: "20kb"}))
//url data 
app.use(express.urlencoded({extended: true, limit: "20kb"}))

app.use(express.static("public"))
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"

// routes declaration
app.use("/api/v1/users", userRouter) 
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)


export { app }