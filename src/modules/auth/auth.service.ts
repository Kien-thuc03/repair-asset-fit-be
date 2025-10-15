import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    // Tìm user bằng username hoặc email
    const user = await this.usersService.findByUsernameOrEmail(username);
    
    if (!user) {
      return null;
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return null;
    }

    // Kiểm tra trạng thái active
    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Loại bỏ password khỏi kết quả trả về
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { 
      username: user.username,
      email: user.email, 
      sub: user.id, 
      role: user.role 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
      },
    };
  }

  async register(userData: any) {
    // Kiểm tra xem username đã tồn tại chưa
    const existingUser = await this.usersService.findByUsername(userData.username);
    if (existingUser) {
      throw new UnauthorizedException('Tên đăng nhập đã tồn tại');
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingEmail = await this.usersService.findByEmail(userData.email);
    if (existingEmail) {
      throw new UnauthorizedException('Email đã được sử dụng');
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Tạo user mới
    const user = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    });
    
    // Loại bỏ password khỏi kết quả
    const { password, ...result } = user;
    return result;
  }
}