import API from "../../api";

export const registerUser = (userData) => {
  return API.post("/auth/register", userData);
};

export const loginUser = (userData) => {
  return API.post("/auth/login", userData);
};

export const getMeUser = () => {
  return API.get("/auth/me");
};

export const googleLoginUser = (credential, role) => {
  return API.post("/auth/google", { credential, role });
};

export const setup2FAUser = () => {
  return API.post("/auth/2fa/setup");
};

export const verify2FAUser = (token) => {
  return API.post("/auth/2fa/verify", { token });
};

export const disable2FAUser = (token) => {
  return API.post("/auth/2fa/disable", { token });
};

export const loginVerify2FAUser = (userId, token) => {
  return API.post("/auth/2fa/login-verify", { userId, token });
};