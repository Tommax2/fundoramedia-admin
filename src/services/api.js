const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4100";

async function request(path, options = {}) {
  const { headers, ...restOptions } = options;
  const mergedHeaders = { ...headers };
  const isFormData = restOptions.body instanceof FormData;

  if (!isFormData) {
    mergedHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: mergedHeaders,
    ...restOptions,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getPosts(params = "") {
    return request(`/api/posts${params}`);
  },
  createPost(payload) {
    return request("/api/posts", { method: "POST", body: JSON.stringify(payload) });
  },
  updatePost(id, payload) {
    return request(`/api/posts/${id}`, { method: "PUT", body: JSON.stringify(payload) });
  },
  deletePost(id) {
    return request(`/api/posts/${id}`, { method: "DELETE" });
  },
  uploadImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    return request("/api/uploads/image", {
      method: "POST",
      body: formData,
    });
  },
  getAnalytics() {
    return request("/api/analytics/summary");
  },
};
