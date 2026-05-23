const POSTS_KEY = "fundora_admin_posts";

const defaultPosts = [
  {
    id: crypto.randomUUID(),
    title: "Welcome To Fundora Media",
    author: "Admin",
    excerpt: "This is your first post. You can edit or delete it from the Blog Manager.",
    status: "Published",
    views: 124,
    createdAt: new Date().toISOString(),
  },
];

export function getPosts() {
  const raw = localStorage.getItem(POSTS_KEY);
  if (!raw) {
    localStorage.setItem(POSTS_KEY, JSON.stringify(defaultPosts));
    return defaultPosts;
  }
  return JSON.parse(raw);
}

export function savePost(post) {
  const posts = getPosts();
  const next = [
    {
      ...post,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      views: Math.floor(Math.random() * 800) + 50,
    },
    ...posts,
  ];
  localStorage.setItem(POSTS_KEY, JSON.stringify(next));
  return next;
}

export function updatePost(updatedPost) {
  const posts = getPosts().map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post));
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return posts;
}

export function deletePost(postId) {
  const posts = getPosts().filter((post) => post.id !== postId);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return posts;
}

export function getAnalytics() {
  const posts = getPosts();
  const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
  const published = posts.filter((post) => post.status === "Published").length;
  const draft = posts.length - published;

  return {
    cards: [
      { label: "Total Posts", value: posts.length },
      { label: "Published", value: published },
      { label: "Draft", value: draft },
      { label: "Total Views", value: totalViews },
    ],
    topPosts: [...posts].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    weeklyTraffic: [
      { day: "Mon", value: 230 },
      { day: "Tue", value: 180 },
      { day: "Wed", value: 340 },
      { day: "Thu", value: 300 },
      { day: "Fri", value: 420 },
      { day: "Sat", value: 275 },
      { day: "Sun", value: 390 },
    ],
  };
}
