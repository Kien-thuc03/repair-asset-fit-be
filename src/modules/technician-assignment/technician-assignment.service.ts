import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TechnicianAssignment } from "src/entities/technician-assignment.entity";
import { User } from "src/entities/user.entity";
import { Room } from "src/entities/room.entity";
import { QueryTechnicianAssignmentDto } from "./dto/query-technician-assignment.dto";
import { UpdateTechnicianAssignmentDto } from "./dto/update-technician-assignment.dto";

@Injectable()
export class TechnicianAssignmentService {
  constructor(
    @InjectRepository(TechnicianAssignment)
    private readonly assignmentRepository: Repository<TechnicianAssignment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>
  ) {}

  /**
   * Lấy tất cả phân công với tùy chọn lọc theo building và floor
   */
  async findAll(
    query: QueryTechnicianAssignmentDto
  ): Promise<TechnicianAssignment[]> {
    const { building, floor } = query;

    const queryBuilder = this.assignmentRepository
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.technician", "technician");

    if (building) {
      queryBuilder.andWhere("assignment.building = :building", { building });
    }

    if (floor !== undefined) {
      if (floor === null || floor === "") {
        queryBuilder.andWhere("assignment.floor IS NULL");
      } else {
        queryBuilder.andWhere("assignment.floor = :floor", { floor });
      }
    }

    queryBuilder
      .orderBy("assignment.building", "ASC")
      .addOrderBy("assignment.floor", "ASC")
      .addOrderBy("technician.username", "ASC");

    return await queryBuilder.getMany();
  }

  /**
   * Lấy danh sách phân công theo tầng cụ thể
   */
  async findByFloor(
    building: string,
    floor: string
  ): Promise<TechnicianAssignment[]> {
    const assignments = await this.assignmentRepository
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.technician", "technician")
      .where("assignment.building = :building", { building })
      .andWhere("assignment.floor = :floor", { floor })
      .orderBy("technician.username", "ASC")
      .getMany();

    return assignments;
  }

  /**
   * Lấy thông tin một phân công theo ID
   */
  async findOne(id: string): Promise<TechnicianAssignment> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ["technician"],
    });

    if (!assignment) {
      throw new NotFoundException(`Không tìm thấy phân công với ID: ${id}`);
    }

    return assignment;
  }

  /**
   * Lấy danh sách phòng với thông tin kỹ thuật viên phụ trách
   * CHÚ Ý: Mỗi tầng chỉ có 1 kỹ thuật viên duy nhất
   */
  async getRoomsWithTechnicians(building?: string, floor?: string) {
    const queryBuilder = this.roomRepository
      .createQueryBuilder("room")
      .leftJoin(
        "technician_assignments",
        "assignment",
        "room.building = assignment.building AND room.floor = assignment.floor"
      )
      .leftJoin(
        "users",
        "technician",
        "assignment.technicianId = technician.id"
      )
      .select([
        "room.id as id",
        "room.name as name",
        'room.roomCode as "roomCode"',
        "room.building as building",
        "room.floor as floor",
        'room.roomNumber as "roomNumber"',
        "room.status as status",
        'assignment.id as "assignmentId"',
        'technician.id as "technicianId"',
        'technician.username as "technicianUsername"',
        'technician.fullName as "technicianName"',
        'technician.email as "technicianEmail"',
        'technician.phoneNumber as "technicianPhone"',
      ])
      .distinct(true); // Thêm DISTINCT để tránh duplicate

    if (building) {
      queryBuilder.andWhere("room.building = :building", { building });
    }

    if (floor) {
      queryBuilder.andWhere("room.floor = :floor", { floor });
    }

    queryBuilder
      .orderBy("room.building", "ASC")
      .addOrderBy("room.floor", "ASC")
      .addOrderBy("room.roomNumber", "ASC");

    const results = await queryBuilder.getRawMany();

    // Loại bỏ duplicate bằng cách group by room.id
    const uniqueResults = results.reduce((acc, row) => {
      if (!acc.find((r) => r.id === row.id)) {
        acc.push(row);
      }
      return acc;
    }, [] as any[]);

    // Format kết quả
    return uniqueResults.map((row) => ({
      id: row.id,
      name: row.name,
      roomCode: row.roomCode,
      building: row.building,
      floor: row.floor,
      roomNumber: row.roomNumber,
      status: row.status,
      assignmentId: row.assignmentId, // ID của assignment để update
      assignedTechnician: row.technicianId
        ? {
            id: row.technicianId,
            username: row.technicianUsername,
            fullName: row.technicianName,
            email: row.technicianEmail,
            phoneNumber: row.technicianPhone,
          }
        : null,
    }));
  }

  /**
   * Lấy danh sách kỹ thuật viên với các phòng họ phụ trách
   */
  async getTechniciansWithRooms() {
    const assignments = await this.assignmentRepository
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.technician", "technician")
      .orderBy("technician.username", "ASC")
      .addOrderBy("assignment.building", "ASC")
      .addOrderBy("assignment.floor", "ASC")
      .getMany();

    // Group by technician
    const technicianMap = new Map();

    for (const assignment of assignments) {
      if (!technicianMap.has(assignment.technicianId)) {
        // Đếm số phòng cho kỹ thuật viên này
        const roomCount = await this.roomRepository
          .createQueryBuilder("room")
          .where("room.building = :building", { building: assignment.building })
          .andWhere("room.floor = :floor", { floor: assignment.floor })
          .getCount();

        technicianMap.set(assignment.technicianId, {
          id: assignment.technician.id,
          username: assignment.technician.username,
          fullName: assignment.technician.fullName,
          email: assignment.technician.email,
          phoneNumber: assignment.technician.phoneNumber,
          assignments: [],
          totalRooms: 0,
        });
      }

      const tech = technicianMap.get(assignment.technicianId);

      // Đếm số phòng cho assignment này
      const roomCount = await this.roomRepository
        .createQueryBuilder("room")
        .where("room.building = :building", { building: assignment.building })
        .andWhere("room.floor = :floor", { floor: assignment.floor })
        .getCount();

      tech.assignments.push({
        building: assignment.building,
        floor: assignment.floor,
        roomCount: roomCount,
      });
      tech.totalRooms += roomCount;
    }

    return Array.from(technicianMap.values());
  }

  /**
   * Cập nhật kỹ thuật viên phụ trách cho một tầng cụ thể
   */
  async update(
    id: string,
    updateDto: UpdateTechnicianAssignmentDto
  ): Promise<TechnicianAssignment> {
    const { building, floor, technicianId } = updateDto;

    console.log("=== UPDATE TECHNICIAN ASSIGNMENT ===");
    console.log("Assignment ID from URL (will be ignored):", id);
    console.log("Building:", building);
    console.log("Floor:", floor);
    console.log("New Technician ID:", technicianId);

    // 1. Kiểm tra technician có tồn tại không
    const technician = await this.userRepository.findOne({
      where: { id: technicianId },
      relations: ["roles"],
    });

    if (!technician) {
      console.log("ERROR: Technician not found");
      throw new NotFoundException(
        `Không tìm thấy kỹ thuật viên với ID: ${technicianId}`
      );
    }

    console.log("Found technician:", {
      id: technician.id,
      username: technician.username,
      fullName: technician.fullName,
      roles: technician.roles?.map((r) => r.code),
    });

    // 2. Kiểm tra user có role technician không
    const isTechnician = technician.roles?.some(
      (role) =>
        role.code === "TECHNICIAN" ||
        role.name.toLowerCase().includes("kỹ thuật viên")
    );

    if (!isTechnician) {
      console.log("ERROR: User is not a technician");
      throw new BadRequestException("User này không phải là kỹ thuật viên");
    }

    // 3. Tìm hoặc tạo assignment cho building-floor với technician mới
    let assignment = await this.assignmentRepository.findOne({
      where: {
        building: building,
        floor: floor,
        technicianId: technicianId,
      },
    });

    if (assignment) {
      // Assignment đã tồn tại - không cần làm gì
      console.log("Assignment already exists:", {
        id: assignment.id,
        technicianId: assignment.technicianId,
        building: assignment.building,
        floor: assignment.floor,
      });
      return assignment;
    }

    // 4. Kiểm tra xem đã có assignment nào khác cho building-floor này chưa
    const existingAssignments = await this.assignmentRepository.find({
      where: {
        building: building,
        floor: floor,
      },
    });

    console.log(
      `Found ${existingAssignments.length} existing assignments for ${building} - ${floor}`
    );

    // 5. Xóa các assignment cũ (nếu có)
    if (existingAssignments.length > 0) {
      console.log("Deleting old assignments...");
      await this.assignmentRepository.remove(existingAssignments);
    }

    // 6. Tạo assignment mới
    console.log(
      "Creating new assignment for this technician-floor combination"
    );
    assignment = this.assignmentRepository.create({
      technicianId: technicianId,
      building: building,
      floor: floor,
    });

    const saved = await this.assignmentRepository.save(assignment);

    console.log("Saved assignment:", {
      id: saved.id,
      technicianId: saved.technicianId,
      building: saved.building,
      floor: saved.floor,
    });
    console.log("=== UPDATE COMPLETE ===");

    return saved;
  }
}
