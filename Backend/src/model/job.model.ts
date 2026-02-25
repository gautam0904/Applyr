import mongoose, { Schema, Document } from 'mongoose';

export interface IPOC {
    name: string;
    email: string;
    mobile: string;
    designation: string;
}

export interface IJob extends Document {
    jobTitle: string;
    company: string;
    location: string;
    techStack: string[];
    experience: string;
    status: string;
    appliedDate: string;
    reminderDate: string;
    linkedInUrl: string;
    resumeUrl: string;
    coverLetterUrl: string;
    poc: IPOC[];
}

const JobSchema: Schema = new Schema({
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    techStack: [{ type: String }],
    experience: { type: String },
    status: { type: String, required: true },
    appliedDate: { type: String, required: true },
    reminderDate: { type: String },
    linkedInUrl: { type: String },
    resumeUrl: { type: String },
    coverLetterUrl: { type: String },
    poc: [{
        name: { type: String },
        email: { type: String },
        mobile: { type: String },
        designation: { type: String }
    }]
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

export default mongoose.model<IJob>('Job', JobSchema);
