import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from '../../common/dto/login.dto';
import { LoginResponseDto } from '../../common/dto/login-response.dto';
import { RegisterDto } from '../../common/dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Đăng nhập hệ thống',
    description: 'Đăng nhập bằng username hoặc email và mật khẩu'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Đăng nhập thành công',
    type: LoginResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Thông tin đăng nhập không chính xác' 
  })
  async login(@Request() req: any, @Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Đăng ký tài khoản mới',
    description: 'Tạo tài khoản người dùng mới trong hệ thống'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Đăng ký thành công' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Dữ liệu không hợp lệ' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Username hoặc email đã tồn tại' 
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}