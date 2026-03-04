import apiClient from "../client";

export interface StreamingSession {
  room_id: string;
  order_id: string;
  user_id: string;
  ally_id: string;
  order_status: string;
  role: "host" | "viewer";
  ws_url: string;
  ice_servers: RTCIceServer[];
}

export const streamingService = {
  getSession: async (orderId: string): Promise<StreamingSession> => {
    const response = await apiClient.get<StreamingSession>(
      `/streaming/orders/${orderId}/session`,
    );
    return response.data;
  },
};
