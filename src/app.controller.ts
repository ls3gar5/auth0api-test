import { Controller, Get, Patch } from '@nestjs/common';
import { AppService } from './app.service';
import { chunk, isEmpty } from 'lodash';
import { EMAILS } from 'db/emails';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getUserIdsToBlock(): Promise<string[]> {
    //1- GET TOKEN
    await this.appService.setToken();

    const emails: string[] = EMAILS[process.env.NODE_ENV];
    const batches = chunk(emails, 8);
    console.log('Amount of email to process: ', emails.length);
    console.log('Batches data to process: ', batches.length);

    //3- Get all Auth0 User id valid to update blocked true
    const userIdsToUpdate: string[] = [];
    let batchIndex = 1;
    for (const batch of batches) {
      console.log('Batch number =>: ', batchIndex);
      await Promise.all(
        batch.map(async (email) => {
          try {
            const [userId, isBlocked] = await this.appService.getUserIdByEmail(
              email,
            );
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

  delay = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 5000);
    });
  };

  @Patch('usersblocked')
  async usersblocked(): Promise<any> {
    const userIdsToUpdate: string[] = await this.getUserIdsToBlock();
    const batches = chunk(userIdsToUpdate, 5);
    console.log('Amount of USERS to update: ', userIdsToUpdate.length);
    console.log('batches to update users process', batches.length);
    //2- UPDATE USER
    const batchIndex = 1;
    const results = [];
    for (const batch of batches) {
      console.log('Batch number =>: ', batchIndex);
      await Promise.all(
        batch.map(async (userId) => {
          try {
            //3- BLOCKED USER BY USER ID
            await this.appService.updateUserById(userId);
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
    }
    return results;
  }
}
