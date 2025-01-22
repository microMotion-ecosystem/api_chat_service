import { Controller, Get, HttpException, UseGuards } from '@nestjs/common';
import {AppService} from '../services/app.service';
import {ApiBearerAuth, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {JwtAuthGuard} from "../core/jwt-auth-guard/jwt-auth.guard";
import { ResponseDto } from '../dtos/response.dto';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {
    }


    @Get()
    // @ApiBearerAuth('access-token')
    // @ApiOperation({summary: 'Check if the API is working'})
    // @ApiResponse({status: 200, description: 'API is working correctly.'})
    isWorking(): ResponseDto<string> {
      return ResponseDto.ok(this.appService.isWorking());
      // return ResponseDto.throwError(this.appService.isWorking());
    }


    @UseGuards(JwtAuthGuard)
    @Get('api/v1/demo')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Demo route'})
    @ApiResponse({status: 200, description: 'Returns a demo text.'})
    demo(): ResponseDto {
        return ResponseDto.msg('demo');
    }
}
