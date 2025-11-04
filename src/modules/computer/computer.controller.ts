import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ComputerService } from "./computer.service";
import { CreateComputerDto } from "./dto/create-computer.dto";
import { UpdateComputerDto } from "./dto/update-computer.dto";

@Controller("computer")
export class ComputerController {
  constructor(private readonly computerService: ComputerService) {}

  /**
   * GET /computer/room/:roomId
   * Lấy tất cả máy tính trong một phòng cụ thể
   *
   * @param roomId - UUID của phòng
   * @returns Danh sách máy tính kèm thông tin asset, room và components
   */
  @Get("room/:roomId")
  @HttpCode(HttpStatus.OK)
  getComputersByRoom(@Param("roomId") roomId: string) {
    return this.computerService.getComputersByRoom(roomId);
  }
  /**
   * GET /computers
   * Lấy tất cả máy tính
   *
   * @returns Danh sách máy tính kèm thông tin asset, room và components
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  getAllComputers() {
    return this.computerService.getAllComputers();
  }

  /**
   * GET /computer/:computerId/components
   * Lấy tất cả components của một máy tính cụ thể
   *
   * @param computerId - UUID của máy tính
   * @returns Danh sách components của máy tính
   */
  @Get(":computerId/components")
  @HttpCode(HttpStatus.OK)
  getComponentsByComputer(@Param("computerId") computerId: string) {
    return this.computerService.getComponentsByComputer(computerId);
  }
}
