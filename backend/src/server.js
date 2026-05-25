import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import Post from "./models/Post.js";
import AnalyticsEvent from "./models/AnalyticsEvent.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4100);
const MONGODB_URI = process.env.MONGODB_URI;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"], credentials: false }));
app.use(express.json());

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function makeUniqueSlug(title, excludeId = null) {
  const base = slugify(title);
  let slug = base || `post-${Date.now()}`;
  let counter = 1;

  while (true) {
    const existing = await Post.findOne({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) }).lean();
    if (!existing) return slug;
    slug = `${base}-${counter}`;
    counter += 1;
  }
}

async function deleteCloudinaryImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error("Cloudinary cleanup failed", error);
  }
}

async function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "fundoramedia",
        resource_type: "image",
      },
      (error, uploaded) => {
        if (error) reject(error);
        else resolve(uploaded);
      }
    );
    stream.end(file.buffer);
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, date: new Date().toISOString(), dbState: mongoose.connection.readyState });
});

app.get("/api/posts", async (req, res) => {
  const onlyPublished = req.query.published === "true";
  const query = onlyPublished ? { status: "Published" } : {};
  const posts = await Post.find(query).sort({ createdAt: -1 }).lean();
  res.json(posts.map((post) => ({ ...post, id: post._id })));
});

app.post("/api/posts", async (req, res) => {
  const {
    title,
    author,
    excerpt,
    content,
    imageUrl,
    imagePublicId,
    secondaryImageUrl,
    secondaryImagePublicId,
    isFeatured,
    status,
  } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: "title and author are required" });
  }

  const slug = await makeUniqueSlug(title);
  const post = await Post.create({
    title,
    author,
    excerpt: excerpt || "",
    content: content || "",
    imageUrl: imageUrl || "",
    imagePublicId: imagePublicId || "",
    secondaryImageUrl: secondaryImageUrl || "",
    secondaryImagePublicId: secondaryImagePublicId || "",
    isFeatured: Boolean(isFeatured),
    status: status || "Draft",
    slug,
  });

  res.status(201).json({ ...post.toObject(), id: post._id });
});

app.put("/api/posts/:id", async (req, res) => {
  const current = await Post.findById(req.params.id);
  if (!current) return res.status(404).json({ error: "post not found" });

  const updates = { ...req.body };
  if (updates.title) updates.slug = await makeUniqueSlug(updates.title, current._id);

  if (current.imagePublicId && updates.imagePublicId && updates.imagePublicId !== current.imagePublicId) {
    await deleteCloudinaryImage(current.imagePublicId);
  }
  if (
    current.secondaryImagePublicId &&
    updates.secondaryImagePublicId &&
    updates.secondaryImagePublicId !== current.secondaryImagePublicId
  ) {
    await deleteCloudinaryImage(current.secondaryImagePublicId);
  }

  const updated = await Post.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).lean();
  res.json({ ...updated, id: updated._id });
});

app.delete("/api/posts/:id", async (req, res) => {
  const deleted = await Post.findByIdAndDelete(req.params.id).lean();

  if (deleted?.imagePublicId) {
    await deleteCloudinaryImage(deleted.imagePublicId);
  }
  if (deleted?.secondaryImagePublicId) {
    await deleteCloudinaryImage(deleted.secondaryImagePublicId);
  }

  res.status(204).send();
});

app.post("/api/analytics/events", async (req, res) => {
  const { type, path: pagePath, postId, meta } = req.body;

  const event = await AnalyticsEvent.create({
    type: type || "page_view",
    path: pagePath || "/",
    postId: postId || null,
    meta: meta || {},
  });

  if (postId && event.type === "post_view") {
    await Post.findByIdAndUpdate(postId, { $inc: { views: 1 } });
  }

  res.status(201).json({ ...event.toObject(), id: event._id });
});

app.post("/api/uploads/image", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "image file is required" });
  }

  try {
    const result = await uploadToCloudinary(req.file);

    res.status(201).json({
      filename: result.public_id,
      publicId: result.public_id,
      url: result.secure_url,
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/uploads/images", upload.array("images", 2), async (req, res, next) => {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: "at least one image file is required" });
  }

  try {
    const results = await Promise.all(files.map((file) => uploadToCloudinary(file)));
    res.status(201).json(
      results.map((result) => ({
        filename: result.public_id,
        publicId: result.public_id,
        url: result.secure_url,
      }))
    );
  } catch (error) {
    next(error);
  }
});

app.get("/api/analytics/summary", async (_req, res) => {
  const [totalPosts, published, totalViews, topPosts] = await Promise.all([
    Post.countDocuments(),
    Post.countDocuments({ status: "Published" }),
    Post.aggregate([{ $group: { _id: null, sum: { $sum: "$views" } } }]),
    Post.find({}).sort({ views: -1 }).limit(5).select("title views").lean(),
  ]);

  const draft = totalPosts - published;
  const totalViewsValue = totalViews[0]?.sum || 0;

  const weeklyTraffic = [];
  for (let i = 6; i >= 0; i -= 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const value = await AnalyticsEvent.countDocuments({ createdAt: { $gte: start, $lt: end } });
    weeklyTraffic.push({ day: start.toLocaleDateString("en-US", { weekday: "short" }), value });
  }

  res.json({
    cards: [
      { label: "Total Posts", value: totalPosts },
      { label: "Published", value: published },
      { label: "Draft", value: draft },
      { label: "Total Views", value: totalViewsValue },
    ],
    weeklyTraffic,
    topPosts: topPosts.map((post) => ({ ...post, id: post._id })),
  });
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }

  if (error.message === "Only image files are allowed") {
    return res.status(400).json({ error: error.message });
  }

  if (error.http_code) {
    return res.status(400).json({ error: error.message || "Cloudinary upload failed" });
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is missing. Add it to your .env file.");
  }

  await mongoose.connect(MONGODB_URI, { dbName: process.env.MONGODB_DB || "fundoramedia" });
  app.listen(PORT, () => {
    console.log(`Fundora backend running on http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
