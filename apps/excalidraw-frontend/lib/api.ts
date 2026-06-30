export const HTTP_URL = process.env.NEXT_PUBLIC_HTTP_URL || "http://localhost:3001";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export async function apiRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const url = `${HTTP_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = token;
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let data: any = {};
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = { message: responseText };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data?.message || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data: data as T,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "An unexpected network error occurred",
    };
  }
}
