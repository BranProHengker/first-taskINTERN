export interface User {
  id: number;
  emailAddress: string;
  password?: string;
  fullName: string;
  companyName: string;
  telp: string;
  salt?: string;
  roleId: number;
  roleName: string;
}

export interface LoginRequest {
  emailAddress: string;
  password?: string;
}

export interface LoginResponse {
  message?: string;
  success: boolean;
  userId: number;
  name?: string;
  email?: string;
  roleId?: number;
  roleName?: string;
  accessToken?: string;
  refreshToken?: string;
  expiredDate?: string;
}

// Based on x.json (Request endpoint)
export interface Ticket {
  id: number;
  requestId?: number;
  status?: string;
  note?: string;
  createDate?: string;
  createBy?: number;
  // Additional fields inferred from GET /api/Request endpoints if typical
  // Since the swagger defines "RequestLog" for updateStatus, 
  // but GET /api/Request might return a list of requests with more info.
  // We will add common fields for display, to be verified against actual API response.
  subject?: string; // Hypothetical
  description?: string; // Hypothetical
}
