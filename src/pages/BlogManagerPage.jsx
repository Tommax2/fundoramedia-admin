import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../services/api";

const emptyForm = {
  title: "",
  author: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  imagePublicId: "",
  secondaryImageUrl: "",
  secondaryImagePublicId: "",
  isFeatured: false,
  status: "Draft",
};

function extractImageFromContent(content = "") {
  const match = String(content).match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] || "";
}

const field =
  "w-full border border-border rounded-xl px-3 py-2.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-accent/30";

const btnPrimary =
  "bg-accent text-white rounded-xl px-4 py-2.5 cursor-pointer border-none hover:opacity-90 transition-opacity";

const btnSm =
  "text-white text-sm rounded-lg px-3 py-1.5 cursor-pointer border-none hover:opacity-90 transition-opacity";

function BlogManagerPage() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [carouselStart, setCarouselStart] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const loadComments = useCallback(() => {
    setCommentsLoading(true);
    api.getComments().then(setComments).finally(() => setCommentsLoading(false));
  }, []);

  const submitLabel = useMemo(() => (editingId ? "Update Post" : "Add Post"), [editingId]);
  const formPreviewUrl = form.imageUrl || extractImageFromContent(form.content);

  useEffect(() => {
    api.getPosts().then(setPosts).finally(() => setLoading(false));
    loadComments();
  }, [loadComments]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.author.trim()) return;

    if (editingId) {
      await api.updatePost(editingId, form);
      setEditingId(null);
    } else {
      await api.createPost(form);
    }

    setForm(emptyForm);
    setPosts(await api.getPosts());
  }

  const usingCarousel = posts.length > 3;
  const visiblePosts = usingCarousel
    ? [0, 1, 2].map((offset) => posts[(carouselStart + offset) % posts.length]).filter(Boolean)
    : posts;

  async function handlePrimaryImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPrimary(true);
      setUploadMessage("Uploading main image...");
      const result = await api.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: result.url, imagePublicId: result.publicId || result.filename }));
      setUploadMessage("Main image uploaded.");
    } catch {
      setUploadMessage("Image upload failed. Check Cloudinary settings and try again.");
    } finally {
      setUploadingPrimary(false);
      event.target.value = "";
    }
  }

  async function handleSecondaryImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingSecondary(true);
      setUploadMessage("Uploading secondary image...");
      const result = await api.uploadImage(file);
      setForm((prev) => ({
        ...prev,
        secondaryImageUrl: result.url,
        secondaryImagePublicId: result.publicId || result.filename,
      }));
      setUploadMessage("Secondary image uploaded.");
    } catch {
      setUploadMessage("Image upload failed. Check Cloudinary settings and try again.");
    } finally {
      setUploadingSecondary(false);
      event.target.value = "";
    }
  }

  function handleEdit(post) {
    setForm({
      title: post.title,
      author: post.author,
      excerpt: post.excerpt,
      content: post.content || "",
      imageUrl: post.imageUrl || "",
      imagePublicId: post.imagePublicId || "",
      secondaryImageUrl: post.secondaryImageUrl || "",
      secondaryImagePublicId: post.secondaryImagePublicId || "",
      isFeatured: Boolean(post.isFeatured),
      status: post.status,
    });
    setEditingId(post.id);
  }

  async function handleDelete(postId) {
    await api.deletePost(postId);
    setPosts(await api.getPosts());
    if (editingId === postId) {
      setEditingId(null);
      setForm(emptyForm);
    }
  }

  async function handleDeleteComment(commentId) {
    await api.deleteComment(commentId);
    setComments((prev) => prev.filter((c) => (c.id || c._id) !== commentId));
  }

  function handleCarouselNext() {
    setCarouselStart((prev) => (prev + 1) % posts.length);
  }

  function handleCarouselPrev() {
    setCarouselStart((prev) => (prev - 1 + posts.length) % posts.length);
  }

  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mt-0 mb-1">Blog Manager</h2>
      <p className="text-muted text-sm mt-0 mb-5">Create, update, and remove blog posts from this panel.</p>

      {/* Form */}
      <form
        className="bg-white border border-border rounded-2xl p-4 shadow-sm mb-5 flex flex-col gap-3"
        onSubmit={handleSubmit}
      >
        <input className={field} name="title" placeholder="Post title" value={form.title} onChange={handleChange} required />
        <input className={field} name="author" placeholder="Author name" value={form.author} onChange={handleChange} required />
        <select className={field} name="status" value={form.status} onChange={handleChange}>
          <option>Draft</option>
          <option>Published</option>
        </select>
        <textarea className={field} name="excerpt" placeholder="Short excerpt" rows="3" value={form.excerpt} onChange={handleChange} />
        <textarea className={field} name="content" placeholder="Full post content" rows="8" value={form.content} onChange={handleChange} />

        <label className="font-semibold text-sm" htmlFor="image-upload">Main image</label>
        <input
          id="image-upload"
          className={field}
          type="file"
          accept="image/*"
          onChange={handlePrimaryImageUpload}
          disabled={uploadingPrimary || uploadingSecondary}
        />

        <label className="font-semibold text-sm" htmlFor="secondary-image-upload">Secondary image</label>
        <input
          id="secondary-image-upload"
          className={field}
          type="file"
          accept="image/*"
          onChange={handleSecondaryImageUpload}
          disabled={uploadingPrimary || uploadingSecondary}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
          <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} className="w-4 h-4" />
          Featured post
        </label>

        {formPreviewUrl ? (
          <div className="max-w-60 rounded-xl border border-border p-1.5 upload-preview-bg">
            <img className="w-full min-h-30 rounded-xl border border-border object-contain bg-white" src={formPreviewUrl} alt="Uploaded preview" />
          </div>
        ) : null}
        {form.secondaryImageUrl ? (
          <div className="max-w-60 rounded-xl border border-border p-1.5 upload-preview-bg">
            <img className="w-full min-h-30 rounded-xl border border-border object-contain bg-white" src={form.secondaryImageUrl} alt="Uploaded secondary preview" />
          </div>
        ) : null}

        {uploadMessage ? <p className="text-muted text-sm m-0">{uploadMessage}</p> : null}

        <button type="submit" className={btnPrimary}>{submitLabel}</button>
      </form>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm overflow-x-auto">
        {loading ? (
          <p className="text-muted text-sm">Loading posts...</p>
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: 640 }}>
            <thead>
              <tr>
                {["Image", "Title", "Author", "Status", "Featured", "Views", "Actions"].map((h) => (
                  <th key={h} className="text-left border-b border-border px-2 py-3 text-sm font-semibold text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="border-b border-border px-2 py-3">
                    {(post.imageUrl || extractImageFromContent(post.content)) ? (
                      <img
                        className="w-16 h-12 object-cover rounded-lg border border-border"
                        src={post.imageUrl || extractImageFromContent(post.content)}
                        alt={post.title}
                      />
                    ) : (
                      <span className="text-muted text-xs">No image</span>
                    )}
                  </td>
                  <td className="border-b border-border px-2 py-3 text-sm font-medium max-w-40 truncate">{post.title}</td>
                  <td className="border-b border-border px-2 py-3 text-sm text-muted">{post.author}</td>
                  <td className="border-b border-border px-2 py-3 text-sm">{post.status}</td>
                  <td className="border-b border-border px-2 py-3 text-sm">{post.isFeatured ? "Yes" : "No"}</td>
                  <td className="border-b border-border px-2 py-3 text-sm">{post.views || 0}</td>
                  <td className="border-b border-border px-2 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(post)} className={`${btnSm} bg-accent`}>Edit</button>
                      <button type="button" onClick={() => handleDelete(post.id)} className={`${btnSm} bg-danger`}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {usingCarousel ? (
          <div className="flex items-center justify-between gap-3 mt-4 flex-wrap sm:flex-nowrap">
            <button type="button" onClick={handleCarouselPrev} className={`${btnPrimary} flex-1 sm:flex-none`}>Previous</button>
            <span className="text-muted text-sm text-center w-full sm:w-auto order-last sm:order-0">
              Showing 3 of {posts.length} posts
            </span>
            <button type="button" onClick={handleCarouselNext} className={`${btnPrimary} flex-1 sm:flex-none`}>Next</button>
          </div>
        ) : null}
      </div>
      {/* Comments */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm mt-5 overflow-x-auto">
        <h3 className="text-base font-bold mt-0 mb-1">Comments</h3>
        <p className="text-muted text-sm mt-0 mb-4">Review and remove reader comments from your posts.</p>
        {commentsLoading ? (
          <p className="text-muted text-sm">Loading comments…</p>
        ) : comments.length === 0 ? (
          <p className="text-muted text-sm">No comments yet.</p>
        ) : (
          <table className="w-full border-collapse" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                {["Post", "Author", "Comment", "Date", ""].map((h) => (
                  <th key={h} className="text-left border-b border-border px-2 py-3 text-sm font-semibold text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id || c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="border-b border-border px-2 py-3 text-sm font-medium max-w-36 truncate">{c.postTitle}</td>
                  <td className="border-b border-border px-2 py-3 text-sm text-muted">{c.author}</td>
                  <td className="border-b border-border px-2 py-3 text-sm max-w-60 truncate">{c.body}</td>
                  <td className="border-b border-border px-2 py-3 text-xs text-muted whitespace-nowrap">
                    {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="border-b border-border px-2 py-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id || c._id)}
                      className={`${btnSm} bg-danger`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default BlogManagerPage;
