import { useEffect, useMemo, useState } from "react";
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

function BlogManagerPage() {
  const [posts, setPosts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPrimary, setUploadingPrimary] = useState(false);
  const [uploadingSecondary, setUploadingSecondary] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [carouselStart, setCarouselStart] = useState(0);

  const submitLabel = useMemo(() => (editingId ? "Update Post" : "Add Post"), [editingId]);
  const formPreviewUrl = form.imageUrl || extractImageFromContent(form.content);

  useEffect(() => {
    api.getPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

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
      setForm((prev) => ({
        ...prev,
        imageUrl: result.url,
        imagePublicId: result.publicId || result.filename,
      }));
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

  function handleCarouselNext() {
    setCarouselStart((prev) => (prev + 1) % posts.length);
  }

  function handleCarouselPrev() {
    setCarouselStart((prev) => (prev - 1 + posts.length) % posts.length);
  }

  return (
    <section>
      <h2>Blog Manager</h2>
      <p className="subtle">Create, update, and remove blog posts from this panel.</p>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <input name="title" placeholder="Post title" value={form.title} onChange={handleChange} required />
        <input name="author" placeholder="Author name" value={form.author} onChange={handleChange} required />
        <select name="status" value={form.status} onChange={handleChange}>
          <option>Draft</option>
          <option>Published</option>
        </select>
        <textarea name="excerpt" placeholder="Short excerpt" rows="3" value={form.excerpt} onChange={handleChange} />
        <textarea name="content" placeholder="Full post content" rows="8" value={form.content} onChange={handleChange} />
        <label className="upload-label" htmlFor="image-upload">Main image</label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          onChange={handlePrimaryImageUpload}
          disabled={uploadingPrimary || uploadingSecondary}
        />
        <label className="upload-label" htmlFor="secondary-image-upload">Secondary image</label>
        <input
          id="secondary-image-upload"
          type="file"
          accept="image/*"
          onChange={handleSecondaryImageUpload}
          disabled={uploadingPrimary || uploadingSecondary}
        />
        <label>
          <input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={handleChange} />
          Featured post
        </label>
        {formPreviewUrl ? (
          <div className="upload-preview-wrap">
            <img className="upload-preview" src={formPreviewUrl} alt="Uploaded preview" />
          </div>
        ) : null}
        {form.secondaryImageUrl ? (
          <div className="upload-preview-wrap">
            <img className="upload-preview" src={form.secondaryImageUrl} alt="Uploaded secondary preview" />
          </div>
        ) : null}
        {uploadMessage ? <p className="subtle upload-message">{uploadMessage}</p> : null}
        <button type="submit">{submitLabel}</button>
      </form>

      <div className="table-wrap card">
        {loading ? (
          <p>Loading posts...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Author</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePosts.map((post) => (
                <tr key={post.id}>
                  <td>
                    {(post.imageUrl || extractImageFromContent(post.content)) ? (
                      <img className="table-image-preview" src={post.imageUrl || extractImageFromContent(post.content)} alt={post.title} />
                    ) : (
                      <span className="subtle">No image</span>
                    )}
                  </td>
                  <td>{post.title}</td>
                  <td>{post.author}</td>
                  <td>{post.status}</td>
                  <td>{post.isFeatured ? "Yes" : "No"}</td>
                  <td>{post.views || 0}</td>
                  <td className="actions">
                    <button type="button" onClick={() => handleEdit(post)}>Edit</button>
                    <button type="button" className="danger" onClick={() => handleDelete(post.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {usingCarousel ? (
          <div className="carousel-controls">
            <button type="button" onClick={handleCarouselPrev}>Previous</button>
            <span className="subtle">Showing 3 of {posts.length} posts</span>
            <button type="button" onClick={handleCarouselNext}>Next</button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default BlogManagerPage;
