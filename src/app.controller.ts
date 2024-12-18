import { Controller, Get, Patch } from '@nestjs/common';
import { AppService } from './app.service';
import { Users } from './users/users.entity';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('typeorm')
  async getuserfromdb(): Promise<Users[]> {
    //1- GET TOKEN
    await this.appService.setToken();
    //2-Get list of Email by Environment
    const batches = await this.appService.batchesEmailListToProcess();
    const emails = await this.appService.getEmailListNotExistInAuth0(batches);
    const list: Users[] = await this.appService.getUserDetailByEmailPostgres(
      emails,
    );
    return list;
  }

  @Get()
  async getUserIdsToBlock(): Promise<string[]> {
    //1- GET TOKEN
    await this.appService.setToken();
    //2-Get list of Email by Environment
    const batches = this.appService.batchesEmailListToProcess();
    //3- Get all Auth0 User id valid to update blocked true
    return await this.appService.getUsersIdList(batches);
  }

  @Patch('usersblocked')
  async usersblocked(): Promise<any> {
    const userIdsToUpdate: string[] = await this.getUserIdsToBlock();
    return await this.appService.setUsersBlocked(userIdsToUpdate);
  }
}
