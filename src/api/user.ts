import request from "../utils/request";

export interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserProfile {
  id: number;
  username: string;
  phone: string;
  nickname: string;
  gender: number;
  avatarUrl: string | null;
  email: string | null;
}

export interface UpdateProfileReq {
  phone: string;
  nickname: string;
  gender: number;
  email: string;
  avatarUrl: string;
}

// 获取个人资料
export const getProfileApi = () => {
  return request.get<any, ApiResult<UserProfile>>("/api/user/profile");
};

// 更新个人资料
export const updateProfileApi = (data: UpdateProfileReq) => {
  return request.put<any, ApiResult<string>>("/api/user/profile", data);
};

// 上传头像
export const uploadAvatarApi = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return request.post<any, ApiResult<string>>("/api/user/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
