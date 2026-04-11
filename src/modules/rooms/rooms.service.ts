import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { CreateRoomDto } from "./dto/create-room.dto";
import { UpdateRoomDto } from "./dto/update-room.dto";
import { RoomResponseDto } from "./dto/room-response.dto";
import { Room } from "src/entities/room.entity";
import { Unit } from "src/entities/unit.entity";
import { plainToInstance } from "class-transformer";
import { User } from "src/entities/user.entity";

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Unit)
    private readonly unitRepository: Repository<Unit>
  ) {}

  async create(
    createRoomDto: CreateRoomDto,
    currentUser?: User
  ): Promise<RoomResponseDto> {
    // --- Chuẩn hóa dữ liệu: đảm bảo "8" và "08" là cùng 1 phòng ---
    const normalizedBuilding = createRoomDto.building.trim().toUpperCase();
    const normalizedFloor = createRoomDto.floor.trim().replace(/^0+/, '') || '0'; // "08" -> "8", "00" -> "0"
    const normalizedRoomNumber = createRoomDto.roomNumber.trim().replace(/^0+/, '') || '0';

    const normalizedDto = {
      ...createRoomDto,
      building: normalizedBuilding,
      floor: normalizedFloor,
      roomNumber: normalizedRoomNumber,
    };

    // Check if unit exists if unitId is provided
    if (normalizedDto.unitId) {
      const unit = await this.unitRepository.findOne({
        where: { id: normalizedDto.unitId },
      });

      if (!unit) {
        throw new NotFoundException("Unit not found");
      }
    }

    // Check for unique room location constraint (based on normalized values)
    const existingLocation = await this.roomRepository.findOne({
      where: {
        building: normalizedDto.building,
        floor: normalizedDto.floor,
        roomNumber: normalizedDto.roomNumber,
        unitId: normalizedDto.unitId ?? null,
      },
    });

    if (existingLocation) {
      throw new ConflictException(
        `Phòng tại Tòa ${normalizedDto.building}, Tầng ${normalizedDto.floor}, Số phòng ${normalizedDto.roomNumber} đã tồn tại trong hệ thống`
      );
    }

    // Generate roomCode and check uniqueness
    const roomCode = await this.generateRoomCode(
      normalizedDto.building,
      normalizedDto.floor,
      normalizedDto.roomNumber,
      normalizedDto.unitId
    );

    const existingRoomCode = await this.roomRepository.findOne({
      where: { roomCode },
    });

    if (existingRoomCode) {
      throw new ConflictException(
        `Mã phòng "${roomCode}" đã tồn tại trong hệ thống. Hãy kiểm tra lại thông tin.`
      );
    }

    const room = this.roomRepository.create(normalizedDto);
    room.createdBy = currentUser;
    room.roomCode = roomCode;


    const savedRoom = await this.roomRepository.save(room);

    // Fetch the room with all relations including adjacent rooms
    const roomWithRelations = await this.roomRepository.findOne({
      where: { id: savedRoom.id },
      // relations: ["unit", "createdBy", "adjacentRooms"],
      relations: ["unit", "createdBy"],
    });

    return plainToInstance(RoomResponseDto, roomWithRelations, {
      excludeExtraneousValues: true,
    });
  }

  private async generateRoomCode(
    building: string,
    floor: string,
    roomNumber: string,
    unitId?: string
  ): Promise<string> {
    const buildingPart = building.toUpperCase();
    const floorPart = floor.padStart(2, "0");
    const roomNumberPart = roomNumber.padStart(2, "0");
    const unit = await this.unitRepository.findOne({
      where: { id: unitId },
    });
    return `${unit?.unitCode ?? ""}${buildingPart}${floorPart}.${roomNumberPart}`;
  }

  async findAll(): Promise<RoomResponseDto[]> {
    const rooms = await this.roomRepository.find({
      // relations: ["unit", "adjacentRooms"],
      relations: ["unit"],
      order: { createdAt: "DESC" },
    });

    return plainToInstance(RoomResponseDto, rooms, {
      excludeExtraneousValues: true,
    });
  }

  async findByUnit(unitId: string): Promise<RoomResponseDto[]> {
    
    // Check if unit exist
    const unit = await this.unitRepository.findOne({
      where: { id: unitId },
    });

    if (!unit) {
      throw new NotFoundException("Unit not found");
    }

    const rooms = await this.roomRepository.find({
      where: { unitId },
      // relations: ["unit", "adjacentRooms"],
      relations: ["unit"],
      order: { roomCode: "ASC" },
    });

    return plainToInstance(RoomResponseDto, rooms, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: string): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id },
      // relations: ["unit", "createdBy", "adjacentRooms"],
      relations: ["unit", "createdBy"],
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    return plainToInstance(RoomResponseDto, room, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updateRoomDto: UpdateRoomDto
  ): Promise<RoomResponseDto> {
    const room = await this.roomRepository.findOne({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    // Check if unit exists if unitId is provided
    if (updateRoomDto.unitId) {
      const unit = await this.unitRepository.findOne({
        where: { id: updateRoomDto.unitId },
      });

      if (!unit) {
        throw new NotFoundException("Unit not found");
      }
    }

    // --- Chuẩn hóa dữ liệu ---
    if (updateRoomDto.building) updateRoomDto.building = updateRoomDto.building.trim().toUpperCase();
    if (updateRoomDto.floor) updateRoomDto.floor = updateRoomDto.floor.trim().replace(/^0+/, '') || '0';
    if (updateRoomDto.roomNumber) updateRoomDto.roomNumber = updateRoomDto.roomNumber.trim().replace(/^0+/, '') || '0';

    // Check for unique room location constraint (excluding current room)
    if (
      updateRoomDto.building ??
      updateRoomDto.floor ??
      updateRoomDto.roomNumber
    ) {
      const building = updateRoomDto.building ?? room.building;
      const floor = updateRoomDto.floor ?? room.floor;
      const roomNumber = updateRoomDto.roomNumber ?? room.roomNumber;

      const existingLocation = await this.roomRepository.findOne({
        where: {
          building,
          floor,
          roomNumber,
          unitId: updateRoomDto.unitId ?? room.unitId ?? null,
        },
      });

      if (existingLocation && existingLocation.id !== id) {
        throw new ConflictException(
          `Phòng tại Tòa ${building}, Tầng ${floor}, Số phòng ${roomNumber} đã tồn tại trong hệ thống`
        );
      }
    }

    Object.assign(room, updateRoomDto);
    // Regenerate roomCode after update
    const newRoomCode = await this.generateRoomCode(
      room.building,
      room.floor,
      room.roomNumber,
      room.unitId
    );

    // Check if new roomCode collides with another room
    if (newRoomCode !== room.roomCode) {
      const existingCode = await this.roomRepository.findOne({ where: { roomCode: newRoomCode } });
      if (existingCode && existingCode.id !== id) {
        throw new ConflictException(
          `Mã phòng "${newRoomCode}" đã tồn tại trong hệ thống.`
        );
      }
    }
    room.roomCode = newRoomCode;

    const updatedRoom = await this.roomRepository.save(room);


    const roomWithRelations = await this.roomRepository.findOne({
      where: { id: updatedRoom.id },
      // relations: ["unit", "createdBy", "adjacentRooms"],
      relations: ["unit", "createdBy"],
    });

    return plainToInstance(RoomResponseDto, roomWithRelations, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    const room = await this.roomRepository.findOne({
      where: { id },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    await this.roomRepository.softDelete(id);
  }
}
