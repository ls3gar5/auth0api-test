import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { EMAILS } from 'db/emails';
import { chunk, isEmpty } from 'lodash';

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

  getEmailListToProcess(): string[][] {
    const emails: string[] = EMAILS[process.env.NODE_ENV];
    const batches = chunk(emails, 8);
    console.log('Amount of email to process: ', emails.length);
    console.log('Batches data to process: ', batches.length);
    return batches;
  }

  async getUsersIdList(batches: string[][]): Promise<string[]> {
    const userIdsToUpdate: string[] = [];
    let batchIndex = 1;
    for (const batch of batches) {
      console.log('Batch number =>: ', batchIndex);
      await Promise.all(
        batch.map(async (email) => {
          try {
            const [userId, isBlocked] = await this.getUserIdByEmail(email);
            if (!isEmpty(userId) && !isBlocked) {
              console.log(email);
              userIdsToUpdate.push(userId);
            }
          } catch (error) {
            console.error(`Error processing email ${email}:`, error);
          }
        }),
      );
      await this.delay();
      batchIndex += 1;
    }
    console.log('Amount of users to update: ', userIdsToUpdate.length);
    return userIdsToUpdate;
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

  async setUsersBlocked(userIdsToUpdate: string[]): Promise<string[]> {
    const batches = chunk(userIdsToUpdate, 5);
    console.log('batches to update users process', batches.length);

    let batchIndex = 1;
    const results = [];
    for (const batch of batches) {
      console.log('Batch number =>: ', batchIndex);
      await Promise.all(
        batch.map(async (userId) => {
          try {
            //3- BLOCKED USER BY USER ID
            await this.updateUserById(userId);
            results.push({
              userId,
              status: 'Updated',
              error: 'OK',
            });
          } catch (error) {
            console.error(`Error processing userId ${userId}:`, error);
            results.push({
              userId,
              status: 'error',
              error: error.message,
            });
          }
        }),
      );
      await this.delay();
      batchIndex += 1;
    }
    return results;
  }

  delay = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  };

  getHello(): string {
    return 'Hello World!';
  }
}
