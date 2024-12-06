import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { isEmpty } from 'lodash';

@Injectable()
export class AppService {
  private axiosInstance: AxiosInstance;
  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env[`AUTH0_${process.env.NODE_ENV}_BASEURL`],
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async setToken(): Promise<void> {
    const response = await this.axiosInstance.post('/oauth/token', {
      client_id: process.env[`AUTH0_${process.env.NODE_ENV}_CLIENT_ID`],
      client_secret: process.env[`AUTH0_${process.env.NODE_ENV}_CLIENT_SECRET`],
      audience: process.env[`AUTH0_${process.env.NODE_ENV}_AUDIENCE`],
      grant_type: 'client_credentials',
    });

    this.axiosInstance.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${response.data.access_token}`;
  }

  async getUserIdByEmail(userEmail: string): Promise<[string, boolean]> {
    const params = { q: `email="${userEmail}"`, search_engine: 'v3' };
    const response = await this.axiosInstance.get('/api/v2/users', { params });
    const userId = response?.data[0]?.user_id;
    const blocked = response?.data[0]?.blocked;
    return [userId, blocked];
  }

  async updateUserById(id: string): Promise<void> {
    if (isEmpty(id)) return;
    const encodeId = encodeURIComponent(id);
    await this.axiosInstance.patch(`/api/v2/users/${encodeId}`, {
      blocked: true,
    });
  }

  getHello(): string {
    return 'Hello World!';
  }
}
