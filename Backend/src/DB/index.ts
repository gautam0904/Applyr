import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const url = `${process.env.MONGODB_URI}/${process.env.DBNAME}`
        console.log(url)
        await mongoose.connect(url);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
};

export default connectDB;