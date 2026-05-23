import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const emptyForm = {
  title: "",
  author: "",
  excerpt: "",
  content: "",
  imageUrl: "",
  imagePublicId: "",
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const submitLabel = useMemo(() => (editingId ? "Update Post" : "Add Post"), [editingId]);
  const formPreviewUrl = form.imageUrl || extractImageFromContent(form.content);

  useEffect(() => {
    api.getPosts().then(setPosts).finally(() => setLoading(false));
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setUploadMessage("Uploading image...");
      const uploaded = await api.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: uploaded.url, imagePublicId: uploaded.publicId || uploaded.filename || "" }));
      setUploadMessage("Image uploaded.");
    } catch (error) {
      setUploadMessage("Image upload failed. Check Cloudinary settings and try again.");
    } finally {
      setUploadingImage(false);
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
        <label className="upload-label" htmlFor="image-upload">Upload image</label>
        <input id="image-upload" type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
        {formPreviewUrl ? (
          <div className="upload-preview-wrap">
            <img className="upload-preview" src={formPreviewUrl} alt="Uploaded preview" />
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
                <th>Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
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
      </div>
    </section>
  );
}

export default BlogManagerPage;
