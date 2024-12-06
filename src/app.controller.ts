import { Controller, Get, Patch } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getUserIdsToBlock(): Promise<string[]> {
    //1- GET TOKEN
    await this.appService.setToken();
    //2-Get list of Auth0List
    const batches = this.appService.getEmailListToProcess();
    //3- Get all Auth0 User id valid to update blocked true
    return await this.appService.getUsersIdList(batches);
  }

  @Patch('usersblocked')
  async usersblocked(): Promise<any> {
    const userIdsToUpdate: string[] = await this.getUserIdsToBlock();
    return await this.appService.setUsersBlocked(userIdsToUpdate);
  }
}
