import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
  {
    type: { type: String, default: "page_view" },
    path: { type: String, default: "/" },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

export default AnalyticsEvent;
