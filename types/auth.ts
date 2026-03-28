export interface AuthUser {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleAuthRequest {
  id_token: string;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
}

export interface GoogleAuthResponse extends AuthTokenResponse {
  user: AuthUser;
}
