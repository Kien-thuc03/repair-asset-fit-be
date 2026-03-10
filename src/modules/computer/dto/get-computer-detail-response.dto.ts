import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO cho thông tin Asset trong Computer Detail Response
 */
export class ComputerAssetDto {
  @ApiProperty({ example: 'uuid-123', description: 'ID của tài sản' })
  id: string;

  @ApiProperty({ example: '19-0205/01', description: 'Mã kế toán' })
  ktCode: string;

  @ApiProperty({ example: '2023.001', description: 'Mã tài sản cố định' })
  fixedCode: string;

  @ApiProperty({ example: 'PC Dell OptiPlex 3080', description: 'Tên tài sản' })
  name: string;

  @ApiProperty({ 
    example: 'Intel Core i5-12400, 16GB RAM, 512GB SSD', 
    description: 'Thông số kỹ thuật',
    required: false 
  })
  specs?: string;

  @ApiProperty({ 
    example: 'IN_USE', 
    description: 'Trạng thái tài sản',
    enum: ['IN_USE', 'WAITING_HANDOVER', 'WAITING_RECEIVE', 'DAMAGED', 'LOST', 'PROPOSED_LIQUIDATION', 'LIQUIDATED', 'WAITING_ALLOCATION']
  })
  status: string;

  @ApiProperty({ example: '2023-01-15', description: 'Ngày nhập' })
  entrydate: string;

  @ApiProperty({ 
    example: 'Dell Technologies Vietnam', 
    description: 'Xuất xứ',
    required: false 
  })
  origin?: string;

  @ApiProperty({ example: 'uuid-category', description: 'ID danh mục' })
  categoryId: string;

  @ApiProperty({ example: 'Máy tính', description: 'Tên danh mục', required: false })
  categoryName?: string;

  @ApiProperty({ example: 'chiếc', description: 'Đơn vị tính' })
  unit: string;

  @ApiProperty({ example: 1, description: 'Số lượng' })
  quantity: number;

  @ApiProperty({ example: 'TSCD', description: 'Loại tài sản' })
  type: string;

  @ApiProperty({ example: 'COMPUTER', description: 'Dạng tài sản' })
  shape: string;
}

/**
 * DTO cho thông tin Room trong Computer Detail Response
 */
export class ComputerRoomDto {
  @ApiProperty({ example: 'uuid-room', description: 'ID của phòng' })
  id: string;

  @ApiProperty({ example: 'Phòng A01.03', description: 'Tên phòng' })
  name: string;

  @ApiProperty({ example: '03', description: 'Số phòng' })
  roomNumber: string;

  @ApiProperty({ example: 'A01.03', description: 'Mã phòng' })
  roomCode: string;

  @ApiProperty({ example: 'A', description: 'Tòa nhà' })
  building: string;

  @ApiProperty({ example: '1', description: 'Tầng' })
  floor: string;

  @ApiProperty({ example: 'uuid-unit', description: 'ID đơn vị', required: false })
  unitId?: string;

  @ApiProperty({ example: 'Khoa CNTT', description: 'Tên đơn vị', required: false })
  unitName?: string;
}

/**
 * DTO cho thông tin Component trong Computer Detail Response
 */
export class ComputerComponentDto {
  @ApiProperty({ example: 'uuid-component', description: 'ID của linh kiện' })
  id: string;

  @ApiProperty({ 
    example: 'CPU', 
    description: 'Loại linh kiện',
    enum: ['CPU', 'RAM', 'MAINBOARD', 'STORAGE', 'GPU', 'PSU', 'CASE', 'MONITOR', 'KEYBOARD', 'MOUSE', 'NETWORK', 'OPTICAL_DRIVE', 'COOLER', 'UPS', 'OTHER', 'NETWORK_CARD', 'SOUND_CARD', 'SPEAKER', 'WEBCAM']
  })
  componentType: string;

  @ApiProperty({ example: 'Intel Core i5-12400', description: 'Tên linh kiện' })
  name: string;

  @ApiProperty({ 
    example: '6 cores, 12 threads, 2.5GHz base', 
    description: 'Thông số kỹ thuật',
    required: false 
  })
  componentSpecs?: string;

  @ApiProperty({ 
    example: 'SN123456789', 
    description: 'Số serial',
    required: false 
  })
  serialNumber?: string;

  @ApiProperty({ 
    example: 'INSTALLED', 
    description: 'Trạng thái linh kiện',
    enum: ['INSTALLED', 'FAULTY', 'REMOVED', 'IN_STOCK']
  })
  status: string;

  @ApiProperty({ example: '2023-01-15T00:00:00.000Z', description: 'Ngày lắp đặt' })
  installedAt: string;

  @ApiProperty({ 
    example: '2024-01-15T00:00:00.000Z', 
    description: 'Ngày tháo',
    required: false 
  })
  removedAt?: string;

  @ApiProperty({ example: 'Linh kiện nguyên bản', description: 'Ghi chú', required: false })
  notes?: string;
}

/**
 * DTO cho thông tin Software trong Computer Detail Response
 */
export class ComputerSoftwareDto {
  @ApiProperty({ example: 'uuid-software', description: 'ID của phần mềm' })
  id: string;

  @ApiProperty({ example: 'uuid-computer-software', description: 'ID của bản ghi computer_software' })
  computerSoftwareId: string;

  @ApiProperty({ example: 'Microsoft Office 2021', description: 'Tên phần mềm' })
  name: string;

  @ApiProperty({ example: '2021', description: 'Phiên bản', required: false })
  version?: string;

  @ApiProperty({ example: 'Microsoft Corporation', description: 'Nhà phát hành', required: false })
  publisher?: string;

  @ApiProperty({ 
    example: 'XXXXX-XXXXX-XXXXX-XXXXX', 
    description: 'License key',
    required: false 
  })
  licenseKey?: string;

  @ApiProperty({ 
    example: '2023-01-15', 
    description: 'Ngày cài đặt',
    required: false 
  })
  installationDate?: string;

  @ApiProperty({ example: 'Cài đặt đầy đủ', description: 'Ghi chú', required: false })
  notes?: string;
}

/**
 * DTO cho thông tin Repair Request Summary
 */
export class RepairRequestSummaryDto {
  @ApiProperty({ example: 5, description: 'Tổng số yêu cầu sửa chữa' })
  total: number;

  @ApiProperty({ example: 2, description: 'Số yêu cầu đang xử lý' })
  inProgress: number;

  @ApiProperty({ example: 3, description: 'Số yêu cầu đã hoàn thành' })
  completed: number;

  @ApiProperty({ 
    example: '2024-11-10T10:30:00.000Z', 
    description: 'Thời gian yêu cầu gần nhất',
    required: false 
  })
  lastRequestDate?: string;
}

/**
 * DTO cho Computer Detail Data
 */
export class ComputerDetailDataDto {
  @ApiProperty({ example: 'uuid-computer', description: 'ID của máy tính' })
  id: string;

  @ApiProperty({ example: '01', description: 'Số máy' })
  machineLabel: string;

  @ApiProperty({ example: 'Máy thực hành sinh viên', description: 'Ghi chú', required: false })
  notes?: string;

  @ApiProperty({ type: ComputerAssetDto, description: 'Thông tin tài sản' })
  asset: ComputerAssetDto;

  @ApiProperty({ type: ComputerRoomDto, description: 'Thông tin phòng', required: false })
  room?: ComputerRoomDto;

  @ApiProperty({ 
    type: [ComputerComponentDto], 
    description: 'Danh sách linh kiện',
    isArray: true 
  })
  components: ComputerComponentDto[];

  @ApiProperty({ example: 7, description: 'Số lượng linh kiện' })
  componentCount: number;

  @ApiProperty({ 
    type: [ComputerSoftwareDto], 
    description: 'Danh sách phần mềm',
    isArray: true,
    required: false 
  })
  software?: ComputerSoftwareDto[];

  @ApiProperty({ example: 3, description: 'Số lượng phần mềm' })
  softwareCount: number;

  @ApiProperty({ 
    type: RepairRequestSummaryDto, 
    description: 'Tóm tắt lịch sử sửa chữa',
    required: false 
  })
  repairSummary?: RepairRequestSummaryDto;
}

/**
 * DTO cho Computer Detail Response
 */
export class GetComputerDetailResponseDto {
  @ApiProperty({ example: true, description: 'Trạng thái thành công' })
  success: boolean;

  @ApiProperty({ example: 'Lấy thông tin chi tiết máy tính thành công', description: 'Thông báo' })
  message: string;

  @ApiProperty({ type: ComputerDetailDataDto, description: 'Dữ liệu chi tiết máy tính' })
  data: ComputerDetailDataDto;
}

