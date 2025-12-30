import api from "./api";

export const register = async (name, email, password) => {
  const { data } = await api.post("/api/UserAuth/Register", {
    name,
    email,
    password,
  });
  return data;
};

export const login = async (email, password) => {
  const { data } = await api.post("/api/UserAuth/Login", {
    email,
    password,
  });
  if (data.success && data.token) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("roles", JSON.stringify(data.roles));
  }
  return data;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("roles");
};
