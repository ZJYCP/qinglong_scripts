import axios from "axios";

export async function request<T>(
  url: string,
  headers: any,
  method: "GET" | "POST",
  data?: any
): Promise<T|null> {
  try {
    const response = await axios({
      url,
      method,
      headers: headers,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`Request failed: ${error}`);
    return null;
  }
}

 