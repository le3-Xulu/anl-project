import API from "./client";

export async function login(email, password) {
  const res = await API.post("/auth/login", { email, password });
  return res.data;
}

export async function signup(email, password, role) {
  const res = await API.post("/auth/signup", { email, password, role });
  return res.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function saveSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}