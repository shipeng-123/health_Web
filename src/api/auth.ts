import request from "../utils/request";

export interface LoginReq {
  username: string;
  password: string;
}

export interface LoginResp {
  token: string;
  username: string;
  nickname: string;
}

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

export const loginApi = (data: LoginReq) => {
  return request.post<any, ApiResult<LoginResp>>("/api/auth/login", data);
};

export interface RegisterReq {
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
  gender?: number;
}

export const registerApi = (data: RegisterReq) => {
  return request.post<any, ApiResult<string>>("/api/auth/register", data);
};
