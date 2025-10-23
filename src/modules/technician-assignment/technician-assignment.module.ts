import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicianAssignmentService } from './technician-assignment.service';
import { TechnicianAssignmentController } from './technician-assignment.controller';
import { TechnicianAssignment } from 'src/entities/technician-assignment.entity';
import { User } from 'src/entities/user.entity';
import { Room } from 'src/entities/room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TechnicianAssignment, User, Room])
  ],
  controllers: [TechnicianAssignmentController],
  providers: [TechnicianAssignmentService],
  exports: [TechnicianAssignmentService], // Export để có thể sử dụng ở module khác
})
export class TechnicianAssignmentModule {}
