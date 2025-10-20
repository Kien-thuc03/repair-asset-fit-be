import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  DeleteUserDto,
  QueryUserDto,
  UserResponseDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('PERM_VIEW_USER')
  @ApiOperation({
    summary: 'Lấy danh sách người dùng',
    description: 'Lấy danh sách tất cả người dùng với phân trang và bộ lọc. Yêu cầu quyền: PERM_VIEW_USER',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách người dùng thành công',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Tham số truy vấn không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền truy cập',
  })
  async findAll(@Query() query: QueryUserDto): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions('PERM_VIEW_USER')
  @ApiOperation({
    summary: 'Lấy thông tin người dùng theo ID',
    description: 'Lấy thông tin chi tiết của một người dùng dựa trên ID. Yêu cầu quyền: PERM_VIEW_USER',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin người dùng thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền truy cập',
  })
  async findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions('PERM_CREATE_USER')
  @ApiOperation({
    summary: 'Tạo người dùng mới',
    description:
      'Tạo một người dùng mới với thông tin được cung cấp. Mật khẩu sẽ được hash tự động. Yêu cầu quyền: PERM_CREATE_USER',
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'Thông tin người dùng cần tạo',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Người dùng đã được tạo thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tên đăng nhập hoặc email đã tồn tại',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền tạo người dùng',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @Permissions('PERM_UPDATE_USER')
  @ApiOperation({
    summary: 'Cập nhật thông tin người dùng',
    description:
      'Cập nhật thông tin của người dùng. Chỉ cần cung cấp các trường cần cập nhật. Yêu cầu quyền: PERM_UPDATE_USER',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng cần cập nhật (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'Thông tin cần cập nhật',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Người dùng đã được cập nhật thành công',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu đầu vào không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tên đăng nhập hoặc email đã tồn tại',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền cập nhật người dùng',
  })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Permissions('PERM_REMOVE_USER')
  @ApiOperation({
    summary: 'Xóa người dùng',
    description:
      'Xóa người dùng khỏi hệ thống. Hỗ trợ cả soft delete (mặc định) và hard delete. Yêu cầu quyền: PERM_REMOVE_USER',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của người dùng cần xóa (UUID)',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @ApiQuery({
    name: 'hard',
    required: false,
    type: Boolean,
    description: 'Xóa vĩnh viễn (true) hoặc xóa mềm (false, mặc định)',
    example: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Người dùng đã được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Xóa người dùng thành công' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy người dùng',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền xóa người dùng',
  })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() deleteUserDto: DeleteUserDto,
  ): Promise<{ message: string }> {
    return this.usersService.remove(id, deleteUserDto);
  }
}