import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("MongoDB Connected Successfully");
    } catch (error) {
        console.log("Error while connecting to MongoDB:", error.message);
        process.exit(1);
    }
};