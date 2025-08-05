import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configured axios instance used throughout the application.  The base URL
 * points at the EduPost backend hosted on Render.  An authorization token
 * stored in AsyncStorage (under the key `@edupost/token`) will be
 * automatically attached as a Bearer token on every request.  If you need
 * to override the base URL (for example when running your own backend
 * locally) you can do so by setting the `EXPO_PUBLIC_API_URL` environment
 * variable.  See `.env.example` in the project root.
 */
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'https://edupost-latest.onrender.com',
});

// Intercept each request and append the JWT if it exists in AsyncStorage.
api.interceptors.request.use(async config => {
  try {
    const token = await AsyncStorage.getItem('@edupost/token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn('Failed to read token from storage', err);
  }
  return config;
});

/**
 * Simple helper method for logging in.  Sends credentials to `/auth/login` and
 * returns the raw axios response.  It's the responsibility of the caller to
 * store the returned token.
 */
export async function login(email: string, password: string) {
  return api.post('/auth/login', { email, password });
}

/**
 * Registers a new user.  The backend accepts name, username, email, roles and
 * password.  Roles can be either a single string ("STUDENT" or "TEACHER") or
 * an array of such values.  See README for more details.
 */
export async function register({
  name,
  username,
  email,
  password,
  roles,
}: {
  name: string;
  username: string;
  email: string;
  password: string;
  roles: string | string[];
}) {
  return api.post('/auth/register', { name, username, email, password, roles });
}

/**
 * Fetch all posts.  Supports pagination via `page` and `limit` query
 * parameters, an optional `search` term and optional `authorId` to filter
 * posts by a specific teacher.
 */
export async function fetchPosts({
  page = 1,
  limit = 10,
  search = '',
  authorId,
}: {
  page?: number;
  limit?: number;
  search?: string;
  authorId?: number;
}) {
  const params: Record<string, any> = { limit, page };
  if (search) params.search = search;
  if (authorId) params.authorId = authorId;
  return api.get('/posts', { params });
}

/**
 * Fetch a single post by its identifier.
 */
export async function fetchPost(id: number) {
  return api.get(`/posts/${id}`);
}

/**
 * Search posts by a search term.  Returns posts whose title or content
 * match the given query.
 */
export async function searchPosts(query: string, page = 1, limit = 10) {
  return api.get('/posts/search', { params: { query, page, limit } });
}

/**
 * Create a new post.  Only teachers may call this endpoint successfully.
 */
export async function createPost({ title, content }: { title: string; content: string }) {
  return api.post('/posts', { title, content });
}

/**
 * Update an existing post.  Only the author or an administrator (teacher) can
 * update a post.
 */
export async function updatePost(
  id: number,
  { title, content }: { title: string; content: string },
) {
  return api.put(`/posts/${id}`, { title, content });
}

/**
 * Delete a post by id.  Only teachers are allowed to delete posts.
 */
export async function deletePost(id: number) {
  return api.delete(`/posts/${id}`);
}

/**
 * Fetch all users (teachers and students).  Accessible only to teachers.  The
 * backend supports pagination but currently accepts only limit and page
 * queries; these can be extended if necessary.
 */
export async function fetchUsers({ page = 1, limit = 10 }: { page?: number; limit?: number }) {
  return api.get('/user', { params: { page, limit } });
}

/**
 * Create a new user.  Teachers can create additional teachers or students.
 */
export async function createUser(data: {
  name: string;
  username: string;
  email: string;
  password: string;
  roles: string | string[];
}) {
  return api.post('/user', data);
}

/**
 * Update an existing user by id.  Teachers can change the role or update
 * profile information for other users.
 */
export async function updateUser(
  id: string,
  data: Partial<{ name: string; username: string; email: string; password: string; roles: string | string[] }>,
) {
  return api.patch(`/user/${id}`, data);
}

/**
 * Delete a user by id.  Teachers can remove other teachers or students.
 */
export async function deleteUser(id: string) {
  return api.delete(`/user/${id}`);
}

/**
 * Find a user by id.  Useful for editing or viewing profile information.
 */
export async function fetchUserById(id: string) {
  return api.get(`/user/${id}`);
}

/**
 * Find a user by email.  Useful if you know the email but not the id.
 */
export async function fetchUserByEmail(email: string) {
  return api.get(`/user/email/${email}`);
}

export default api;