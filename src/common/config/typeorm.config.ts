import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from "@nestjs/typeorm";
import { Role } from "src/entities/role.entity";
import { Permission } from "src/entities/permission.entity";
import { Unit } from "src/entities/unit.entity";
import { User } from "src/entities/user.entity";
import { ManagerPermission } from "src/entities/manager-permission.entity";
import { Category } from "src/entities/category.entity";
import { DataSource } from "typeorm";
import { Room } from "src/entities/room.entity";
import { Asset, FixedAsset, ToolsEquipment } from "src/entities/asset.entity";
import { RfidTag } from "src/entities/rfid-tag.entity";
import { FileUrl } from "src/entities/file-url.entity";
import { InventorySession } from "src/entities/inventory-session.entity";
import { InventorySessionUnit } from "src/entities/inventory-session-unit.entity";
import { InventorySessionMember } from "src/entities/inventory-session-member.entity";
import { InventorySub } from "src/entities/inventory-sub.entity";
import { SubInventoryMember } from "src/entities/sub-inventory-member.entity";
import { InventoryGroup } from "src/entities/inventory-group";
import { InventoryGroupMember } from "src/entities/inventory-group-member.entity";
import { InventoryGroupAssignment } from "src/entities/inventory-group-assignment";
import { InventoryResult } from "src/entities/inventory-result";
import { AssetBook } from "src/entities/asset-book.entity";
import { AssetBookItem } from "src/entities/asset-book-item.entity";
import { Alert } from "src/entities/alert.entity";
import { Computer } from "src/entities/computer.entity";
import { ComputerComponent } from "src/entities/computer-component.entity";
import { Software } from "src/entities/software.entity";
import { AssetSoftware } from "src/entities/asset-software.entity";
import { ErrorType } from "src/entities/error-type.entity";
import { DamageReport } from "src/entities/damage-report.entity";
import { RepairRequest } from "src/entities/repair-request.entity";
import { RepairLog } from "src/entities/repair-log.entity";
import { RepairRequestComponent } from "src/entities/repair-request-component.entity";
import { AssetTransaction } from "src/entities/asset-transaction.entity";
import { AssetTransactionItem } from "src/entities/asset-transaction-item.entity";
import { LiquidationProposal } from "src/entities/liquidation-proposal.entity";
import { LiquidationProposalItem } from "src/entities/liquidation-proposal-item.entity";
import { ReplacementProposal } from "src/entities/replacement-proposal.entity";
import { ReplacementItem } from "src/entities/replacement-item.entity";
import { AlertResolution } from "src/entities/alert-resolution.entity";
import { TechnicianAssignment } from "src/entities/technician-assignment.entity";
import { SoftwareProposal } from "src/entities/software-proposal.entity";
import { SoftwareProposalItem } from "src/entities/software-proposal-item.entity";
import { ProposalRepairRequest } from "src/entities/proposal-repair-request.entity";
import { InventoryCommittee } from "src/entities/inventory-committee.entity";
import { InventoryCommitteeMember } from "src/entities/inventory-committee-member.entity";

export const TypeOrmAsyncConfig: TypeOrmModuleAsyncOptions = {
  imports: [],
  useFactory: (): TypeOrmModuleOptions => {
    return {
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "asset",
      // Connection pool configuration
      extra: {
        connectionLimit: 5,
        acquireTimeout: 30000,
        timeout: 30000,
        reconnect: true,
        multipleStatements: false,
        idleTimeout: 300000,
        maxReconnects: 3,
        reconnectDelay: 2000,
      },
      entities: [
        Permission, 
        Role, 
        Unit, 
        User, 
        ManagerPermission, 
        Category, 
        Room, 
        Asset, 
        RfidTag, 
        FixedAsset, 
        ToolsEquipment, 
        FileUrl, 
        InventorySession, 
        InventorySessionUnit,
        InventorySessionMember,
        InventorySub,
        SubInventoryMember,
        InventoryGroup,
        InventoryGroupMember,
        InventoryGroupAssignment,
        InventoryResult,
        AssetBook,
        AssetBookItem,
        Alert,
        Computer,
        ComputerComponent,
        Software,
        AssetSoftware,
        ErrorType,
        DamageReport,
        RepairRequest,
        RepairLog,
        RepairRequestComponent,
        AssetTransaction,
        AssetTransactionItem,
        LiquidationProposal,
        LiquidationProposalItem,
        ReplacementProposal,
        ReplacementItem,
        AlertResolution,
        TechnicianAssignment,
        SoftwareProposal,
        SoftwareProposalItem,
        ProposalRepairRequest,
        InventoryCommittee,
        InventoryCommitteeMember
      ],
      synchronize: false,
      logging: false,
      migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
      migrationsTableName: "typeorm_migrations",
    };
  },
  inject: [],
};

const dataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "asset",
  extra: {
    connectionLimit: 3,
    acquireTimeout: 20000,
    timeout: 20000,
  },
  entities: [
    Permission, 
    Role, 
    Unit, 
    User, 
    ManagerPermission, 
    Category, 
    Room, 
    Asset, 
    FixedAsset, 
    ToolsEquipment, 
    RfidTag, 
    FileUrl, 
    InventorySession, 
    InventorySessionUnit,
    InventorySessionMember,
    InventorySub,
    SubInventoryMember,
    InventoryGroup,
    InventoryGroupMember,
    InventoryGroupAssignment,
    InventoryResult,
    AssetBook,
    AssetBookItem,
    Alert,
    Computer,
    ComputerComponent,
    Software,
    AssetSoftware,
    ErrorType,
    DamageReport,
    RepairRequest,
    RepairLog,
    RepairRequestComponent,
    AssetTransaction,
    AssetTransactionItem,
    LiquidationProposal,
    LiquidationProposalItem,
    ReplacementProposal,
    ReplacementItem,
    AlertResolution,
    TechnicianAssignment,
    SoftwareProposal,
    SoftwareProposalItem,
    ProposalRepairRequest,
    InventoryCommittee,
    InventoryCommitteeMember
  ],
  migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
  migrationsTableName: "typeorm_migrations",
});

export default dataSource;
