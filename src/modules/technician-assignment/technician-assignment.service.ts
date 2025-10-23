import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicianAssignment } from 'src/entities/technician-assignment.entity';
import { User } from 'src/entities/user.entity';
import { Room } from 'src/entities/room.entity';
import { CreateTechnicianAssignmentDto } from './dto/create-technician-assignment.dto';
import { QueryTechnicianAssignmentDto } from './dto/query-technician-assignment.dto';

@Injectable()
export class TechnicianAssignmentService {
    constructor(
        @InjectRepository(TechnicianAssignment)
        private readonly assignmentRepository: Repository<TechnicianAssignment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Room)
        private readonly roomRepository: Repository<Room>,
    ) {}

    /**
     * Tạo phân công mới cho kỹ thuật viên
     * - Một KTV có thể quản lý cả tòa nhà (floor = null)
     * - Hoặc quản lý nhiều tầng cụ thể trong một hoặc nhiều tòa nhà
     */
    async create(createDto: CreateTechnicianAssignmentDto): Promise<TechnicianAssignment> {
        const { technicianId, building, floor } = createDto;

        // Kiểm tra kỹ thuật viên có tồn tại không
        const technician = await this.userRepository.findOne({
            where: { id: technicianId },
            relations: ['roles'],
        });

        if (!technician) {
            throw new NotFoundException(`Không tìm thấy kỹ thuật viên với ID: ${technicianId}`);
        }

        // Kiểm tra user có role technician không
        const isTechnician = technician.roles?.some(role => 
            role.name.toLowerCase() === 'technician' || 
            role.name.toLowerCase() === 'kỹ thuật viên'
        );

        if (!isTechnician) {
            throw new BadRequestException('User này không phải là kỹ thuật viên');
        }

        // Kiểm tra tòa nhà có tồn tại trong hệ thống không
        const buildingExists = await this.roomRepository.findOne({
            where: { building },
        });

        if (!buildingExists) {
            throw new BadRequestException(`Tòa nhà "${building}" không tồn tại trong hệ thống`);
        }

        // Nếu có floor, kiểm tra tầng có tồn tại trong tòa nhà đó không
        if (floor) {
            const floorExists = await this.roomRepository.findOne({
                where: { building, floor },
            });

            if (!floorExists) {
                throw new BadRequestException(
                    `Tầng "${floor}" không tồn tại trong tòa nhà "${building}"`
                );
            }
        }

        // Kiểm tra xem đã có phân công trùng lặp chưa
        const existingAssignment = await this.assignmentRepository.findOne({
            where: { technicianId, building, floor: floor || null },
        });

        if (existingAssignment) {
            throw new ConflictException(
                `KTV này đã được phân công cho ${floor ? `tầng ${floor} của ` : ''}tòa nhà ${building}`
            );
        }

        // Tạo phân công mới
        const assignment = this.assignmentRepository.create({
            technicianId,
            building,
            floor: floor || null,
        });

        return await this.assignmentRepository.save(assignment);
    }

    /**
     * Lấy danh sách phân công theo điều kiện lọc
     */
    async findAll(query: QueryTechnicianAssignmentDto): Promise<TechnicianAssignment[]> {
        const { technicianId, building, floor } = query;

        const queryBuilder = this.assignmentRepository
            .createQueryBuilder('assignment')
            .leftJoinAndSelect('assignment.technician', 'technician');

        if (technicianId) {
            queryBuilder.andWhere('assignment.technicianId = :technicianId', { technicianId });
        }

        if (building) {
            queryBuilder.andWhere('assignment.building = :building', { building });
        }

        if (floor !== undefined) {
            if (floor === null || floor === '') {
                // Tìm các phân công quản lý cả tòa nhà
                queryBuilder.andWhere('assignment.floor IS NULL');
            } else {
                queryBuilder.andWhere('assignment.floor = :floor', { floor });
            }
        }

        queryBuilder.orderBy('assignment.building', 'ASC')
            .addOrderBy('assignment.floor', 'ASC');

        return await queryBuilder.getMany();
    }

    /**
     * Lấy thông tin một phân công cụ thể
     */
    async findOne(technicianId: string, building: string, floor?: string): Promise<TechnicianAssignment> {
        const assignment = await this.assignmentRepository.findOne({
            where: { 
                technicianId, 
                building, 
                floor: floor || null 
            },
            relations: ['technician'],
        });

        if (!assignment) {
            throw new NotFoundException(
                `Không tìm thấy phân công cho KTV tại ${floor ? `tầng ${floor} của ` : ''}tòa nhà ${building}`
            );
        }

        return assignment;
    }

    /**
     * Lấy danh sách KTV được phân công cho một phòng cụ thể
     * Dựa vào building và floor của phòng để tìm KTV phù hợp
     */
    async getTechniciansForRoom(roomId: string): Promise<User[]> {
        const room = await this.roomRepository.findOne({
            where: { id: roomId },
        });

        if (!room) {
            throw new NotFoundException(`Không tìm thấy phòng với ID: ${roomId}`);
        }

        // Tìm các KTV được phân công cho:
        // 1. Tầng cụ thể của tòa nhà đó
        // 2. Hoặc cả tòa nhà đó (floor = null)
        const assignments = await this.assignmentRepository
            .createQueryBuilder('assignment')
            .leftJoinAndSelect('assignment.technician', 'technician')
            .where('assignment.building = :building', { building: room.building })
            .andWhere(
                '(assignment.floor = :floor OR assignment.floor IS NULL)',
                { floor: room.floor }
            )
            .getMany();

        return assignments.map(a => a.technician);
    }

    /**
     * Lấy danh sách kỹ thuật viên phù hợp cho một repair request
     * Dựa vào vị trí của asset (room -> building, floor)
     */
    async getSuggestedTechniciansForAsset(assetId: string): Promise<User[]> {
        // Query để lấy thông tin room của asset thông qua currentRoomId
        const asset = await this.assignmentRepository.query(`
            SELECT r.id, r.building, r.floor
            FROM assets a
            JOIN rooms r ON a."currentRoomId" = r.id
            WHERE a.id = $1
        `, [assetId]);

        if (!asset || asset.length === 0) {
            throw new NotFoundException(`Không tìm thấy asset hoặc asset chưa được gán phòng`);
        }

        const { building, floor } = asset[0];

        // Tìm KTV được phân công cho tầng hoặc tòa nhà đó
        const assignments = await this.assignmentRepository
            .createQueryBuilder('assignment')
            .leftJoinAndSelect('assignment.technician', 'technician')
            .where('assignment.building = :building', { building })
            .andWhere(
                '(assignment.floor = :floor OR assignment.floor IS NULL)',
                { floor }
            )
            .getMany();

        return assignments.map(a => a.technician);
    }

    /**
     * Xóa một phân công
     */
    async remove(technicianId: string, building: string, floor?: string): Promise<void> {
        const assignment = await this.findOne(technicianId, building, floor);
        await this.assignmentRepository.remove(assignment);
    }

    /**
     * Lấy tất cả các tòa nhà và tầng hiện có trong hệ thống
     */
    async getBuildingsAndFloors(): Promise<{ building: string; floors: string[] }[]> {
        const rooms = await this.roomRepository
            .createQueryBuilder('room')
            .select('DISTINCT room.building', 'building')
            .addSelect('room.floor', 'floor')
            .orderBy('room.building', 'ASC')
            .addOrderBy('room.floor', 'ASC')
            .getRawMany();

        const buildingMap = new Map<string, Set<string>>();

        rooms.forEach(room => {
            if (!buildingMap.has(room.building)) {
                buildingMap.set(room.building, new Set());
            }
            buildingMap.get(room.building).add(room.floor);
        });

        return Array.from(buildingMap.entries()).map(([building, floors]) => ({
            building,
            floors: Array.from(floors).sort(),
        }));
    }

    /**
     * Xóa tất cả phân công của một kỹ thuật viên
     */
    async removeAllAssignmentsForTechnician(technicianId: string): Promise<void> {
        await this.assignmentRepository.delete({ technicianId });
    }

    /**
     * Lấy thống kê về số lượng phân công theo từng tòa nhà
     */
    async getAssignmentStatistics(): Promise<any[]> {
        return await this.assignmentRepository
            .createQueryBuilder('assignment')
            .select('assignment.building', 'building')
            .addSelect('COUNT(DISTINCT assignment.technicianId)', 'technicianCount')
            .addSelect('COUNT(*)', 'assignmentCount')
            .groupBy('assignment.building')
            .orderBy('assignment.building', 'ASC')
            .getRawMany();
    }
}
