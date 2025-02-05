import { Controller, Get, Patch } from '@nestjs/common';
import { AppService } from './app.service';
import { Users } from './users/users.entity';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('users')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({
    summary:
      'From a main list, query Auth0 (doesnt exist) and get users by email from users database',
  })
  @ApiResponse({ status: 200, description: 'List of users', type: [Users] })
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

  @ApiOperation({ summary: 'Get user IDs to block' })
  @ApiResponse({ status: 200, description: 'List of user IDs', type: [String] })
  @Get()
  async getUserIdsToBlock(): Promise<string[]> {
    //1- GET TOKEN
    await this.appService.setToken();
    //2-Get list of Email by Environment
    const batches = this.appService.batchesEmailListToProcess();
    //3- Get all Auth0 User id valid to update blocked true
    return await this.appService.getUsersIdList(batches);
  }

  @ApiOperation({ summary: 'Block users' })
  @ApiResponse({ status: 200, description: 'Users blocked' })
  @Patch('usersblocked')
  async usersblocked(): Promise<any> {
    const userIdsToUpdate: string[] = await this.getUserIdsToBlock();
    return await this.appService.setUsersBlocked(userIdsToUpdate);
  }
}
