import { Controller, Get, Param, HttpStatus, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AssetSoftwareService } from "./asset-software.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Asset Software")
@Controller("api/v1/asset-software")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetSoftwareController {
  constructor(private readonly assetSoftwareService: AssetSoftwareService) {}

  @Get("asset/:assetId")
  @ApiOperation({ summary: "Lấy tất cả phần mềm của 1 tài sản" })
  @ApiParam({ name: "assetId", description: "ID của tài sản" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách thành công",
  })
  async getSoftwareByAsset(@Param("assetId") assetId: string) {
    return this.assetSoftwareService.getSoftwareByAsset(assetId);
  }

  @Get("asset/:assetId/software/:softwareId")
  @ApiOperation({ summary: "Lấy chi tiết 1 phần mềm trên 1 tài sản" })
  @ApiParam({ name: "assetId", description: "ID của tài sản" })
  @ApiParam({ name: "softwareId", description: "ID của phần mềm" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy thông tin chi tiết thành công",
  })
  async getSoftwareDetail(
    @Param("assetId") assetId: string,
    @Param("softwareId") softwareId: string
  ) {
    return this.assetSoftwareService.getSoftwareDetail(assetId, softwareId);
  }
}
