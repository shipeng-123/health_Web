import axios from "axios";
import { ElMessage } from "element-plus";

const request = axios.create({
  baseURL: "http://localhost:8080", // 你的后端地址
  timeout: 10000,
});

// 请求拦截器：自动带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    ElMessage.error(error?.response?.data?.message || "请求失败");
    return Promise.reject(error);
  }
);

export default request;
