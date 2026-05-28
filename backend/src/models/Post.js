import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    secondaryImageUrl: { type: String, default: "" },
    secondaryImagePublicId: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: ["Draft", "Published"], default: "Draft" },
    slug: { type: String, required: true, unique: true, index: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);

export default Post;
