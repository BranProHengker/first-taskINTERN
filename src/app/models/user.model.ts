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
  requestId?: number; // Keeping for backward compat if needed, or map id to it
  requestNo?: string;
  status?: string;
  note?: string;
  createDate?: string;
  createBy?: number;
  roleName?: string;
  subject?: string;
  description?: string;
  capture?: string;
  latitude?: number;
  longitude?: number;
  details?: TicketDetail[];
}

export interface TicketDetail {
  id?: number;
  serviceId: number;
  serviceName?: string;
  requestId?: number;
}
