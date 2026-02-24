import request from "../utils/request";

export const helloApi = () => request.get("/test/hello");
export const testDbApi = () => request.get("/test/db");
