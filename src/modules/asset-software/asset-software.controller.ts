import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { AssetSoftwareService } from "./asset-software.service";
import { CreateAssetSoftwareDto } from "./dto/create-asset-software.dto";
import { UpdateAssetSoftwareDto } from "./dto/update-asset-software.dto";
import { AssetSoftwareResponseDto } from "./dto/asset-software-response.dto";
import { AssetSoftwareFilterDto } from "./dto/asset-software-filter.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  StandardResponseDto,
  ErrorResponseDto,
} from "src/common/dto/response.dto";
import { ResponseDto } from "./interfaces/response.interface";

@ApiTags("Asset Software")
@Controller("asset-software")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AssetSoftwareController {
  constructor(private readonly assetSoftwareService: AssetSoftwareService) {}

  @Post()
  @ApiOperation({
    summary: "Thêm phần mềm vào máy tính",
    description: "Thêm một phần mềm cụ thể vào một máy tính/tài sản",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Thêm phần mềm vào tài sản thành công",
    type: AssetSoftwareResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu đầu vào không hợp lệ",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy tài sản hoặc phần mềm",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Phần mềm đã được cài đặt trên tài sản này",
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async addSoftwareToAsset(
    @Body() createAssetSoftwareDto: CreateAssetSoftwareDto
  ) {
    return await this.assetSoftwareService.addSoftwareToAsset(
      createAssetSoftwareDto
    );
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách phần mềm được cài đặt",
    description:
      "Lấy danh sách tất cả phần mềm được cài đặt trên các tài sản với khả năng lọc và phân trang",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách thành công",
    type: [AssetSoftwareResponseDto],
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng item trên mỗi trang",
    example: 10,
  })
  @ApiQuery({
    name: "assetId",
    required: false,
    description: "Lọc theo ID tài sản",
  })
  @ApiQuery({
    name: "softwareId",
    required: false,
    description: "Lọc theo ID phần mềm",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Tìm kiếm theo tên tài sản hoặc tên phần mềm",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    description: "Sắp xếp theo trường",
    example: "installationDate",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    description: "Thứ tự sắp xếp",
    enum: ["ASC", "DESC"],
    example: "DESC",
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAssetSoftwareList(@Query() filter: AssetSoftwareFilterDto) {
    return await this.assetSoftwareService.getAssetSoftwareList(filter);
  }

  @Get(":assetId/:softwareId")
  @ApiOperation({
    summary: "Lấy thông tin chi tiết phần mềm được cài đặt",
    description:
      "Lấy thông tin chi tiết về một phần mềm được cài đặt trên một tài sản cụ thể",
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy thông tin chi tiết thành công",
    type: AssetSoftwareResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phần mềm được cài đặt trên tài sản",
    type: ErrorResponseDto,
  })
  async getAssetSoftwareDetail(
    @Param("assetId") assetId: string,
    @Param("softwareId") softwareId: string
  ) {
    return await this.assetSoftwareService.getAssetSoftwareDetail(
      assetId,
      softwareId
    );
  }

  @Put(":assetId/:softwareId")
  @ApiOperation({
    summary: "Cập nhật thông tin cài đặt phần mềm",
    description:
      "Cập nhật thông tin về việc cài đặt phần mềm trên tài sản (ngày cài đặt, ghi chú)",
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cập nhật thông tin thành công",
    type: AssetSoftwareResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phần mềm được cài đặt trên tài sản",
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu đầu vào không hợp lệ",
    type: ErrorResponseDto,
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateAssetSoftware(
    @Param("assetId") assetId: string,
    @Param("softwareId") softwareId: string,
    @Body() updateAssetSoftwareDto: UpdateAssetSoftwareDto
  ) {
    return await this.assetSoftwareService.updateAssetSoftware(
      assetId,
      softwareId,
      updateAssetSoftwareDto
    );
  }

  @Delete(":assetId/:softwareId")
  @ApiOperation({
    summary: "Gỡ phần mềm khỏi tài sản",
    description: "Gỡ bỏ một phần mềm khỏi một tài sản cụ thể",
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Gỡ phần mềm thành công",
    type: StandardResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phần mềm được cài đặt trên tài sản",
    type: ErrorResponseDto,
  })
  async removeSoftwareFromAsset(
    @Param("assetId") assetId: string,
    @Param("softwareId") softwareId: string
  ) {
    return await this.assetSoftwareService.removeSoftwareFromAsset(
      assetId,
      softwareId
    );
  }

  @Get("asset/:assetId")
  @ApiOperation({
    summary: "Lấy danh sách phần mềm của một tài sản",
    description:
      "Lấy danh sách tất cả phần mềm được cài đặt trên một tài sản cụ thể",
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng item trên mỗi trang",
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách thành công",
    type: [AssetSoftwareResponseDto],
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAssetSoftwareByAssetId(
    @Param("assetId") assetId: string,
    @Query() filter: AssetSoftwareFilterDto
  ) {
    filter.assetId = assetId;
    return await this.assetSoftwareService.getAssetSoftwareList(filter);
  }

  @Get("software/:softwareId")
  @ApiOperation({
    summary: "Lấy danh sách tài sản có cài một phần mềm",
    description: "Lấy danh sách tất cả tài sản đã cài đặt một phần mềm cụ thể",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng item trên mỗi trang",
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách thành công",
    type: [AssetSoftwareResponseDto],
  })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAssetSoftwareBySoftwareId(
    @Param("softwareId") softwareId: string,
    @Query() filter: AssetSoftwareFilterDto
  ) {
    filter.softwareId = softwareId;
    return await this.assetSoftwareService.getAssetSoftwareList(filter);
  }
}
