import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User } from '../../entities/user.entity';
import {
  CreateUserDto,
  UpdateUserDto,
  DeleteUserDto,
  QueryUserDto,
  UserResponseDto,
} from './dto';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Lấy danh sách người dùng với phân trang và bộ lọc
   */
  async findAll(query: QueryUserDto): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      status,
      unitId,
      roleId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    // Tạo query builder
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('user.unit', 'unit');

    // Tìm kiếm
    if (search) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.fullName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Lọc theo trạng thái
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    // Lọc theo đơn vị
    if (unitId) {
      queryBuilder.andWhere('user.unitId = :unitId', { unitId });
    }

    // Lọc theo vai trò
    if (roleId) {
      queryBuilder.andWhere('role.id = :roleId', { roleId });
    }

    // Đếm tổng số
    const total = await queryBuilder.getCount();

    // Sắp xếp
    const allowedSortFields = ['fullName', 'email', 'createdAt', 'updatedAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`user.${sortField}`, sortOrder);

    // Phân trang
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Lấy dữ liệu
    const users = await queryBuilder.getMany();

    // Chuyển đổi sang DTO
    const data = users.map((user) => this.toUserResponseDto(user));

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy thông tin người dùng theo ID
   */
  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'unit'],
    });

    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    return this.toUserResponseDto(user);
  }

  /**
   * Tìm người dùng theo email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  /**
   * Tìm người dùng theo username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['roles'],
    });
  }

  /**
   * Tìm người dùng theo username hoặc email
   */
  async findByUsernameOrEmail(identifier: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ username: identifier }, { email: identifier }],
      relations: ['roles'],
    });
  }

  /**
   * Tạo người dùng mới
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { username, email, password, roleIds, ...userData } = createUserDto;

    // Kiểm tra username đã tồn tại
    const existingUsername = await this.findByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }

    // Kiểm tra email đã tồn tại
    const existingEmail = await this.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email đã tồn tại');
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Tạo user entity
    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      ...userData,
    });

    // Nếu có roleIds, gán roles
    if (roleIds && roleIds.length > 0) {
      user.roles = roleIds.map((id) => ({ id } as any));
    }

    // Lưu vào database
    const savedUser = await this.userRepository.save(user);

    // Lấy lại user với relations
    return this.findOne(savedUser.id);
  }

  /**
   * Cập nhật thông tin người dùng
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    const { username, email, password, roleIds, ...userData } = updateUserDto;

    // Kiểm tra username nếu có thay đổi
    if (username && username !== user.username) {
      const existingUsername = await this.findByUsername(username);
      if (existingUsername) {
        throw new ConflictException('Tên đăng nhập đã tồn tại');
      }
      user.username = username;
    }

    // Kiểm tra email nếu có thay đổi
    if (email && email !== user.email) {
      const existingEmail = await this.findByEmail(email);
      if (existingEmail) {
        throw new ConflictException('Email đã tồn tại');
      }
      user.email = email;
    }

    // Hash mật khẩu mới nếu có
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    // Cập nhật các trường khác
    Object.assign(user, userData);

    // Nếu có roleIds, cập nhật roles
    if (roleIds) {
      user.roles = roleIds.map((id) => ({ id } as any));
    }

    // Lưu thay đổi
    await this.userRepository.save(user);

    // Trả về user đã cập nhật
    return this.findOne(id);
  }

  /**
   * Xóa người dùng
   */
  async remove(
    id: string,
    deleteUserDto: DeleteUserDto,
  ): Promise<{ message: string }> {
    // Kiểm tra user tồn tại
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }

    const { hard = false } = deleteUserDto;

    if (hard) {
      // Hard delete - xóa vĩnh viễn
      await this.userRepository.remove(user);
      return { message: 'Xóa người dùng vĩnh viễn thành công' };
    } else {
      // Soft delete - xóa mềm
      await this.userRepository.softRemove(user);
      return { message: 'Xóa người dùng thành công' };
    }
  }

  /**
   * Chuyển đổi User entity sang UserResponseDto
   */
  private toUserResponseDto(user: User): UserResponseDto {
    const dto = plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // Chuyển đổi roles nếu có
    if (user.roles) {
      dto.roles = user.roles.map((role) => ({
        id: role.id,
        name: role.name,
        code: role.code,
      }));
    }

    return dto;
  }
}