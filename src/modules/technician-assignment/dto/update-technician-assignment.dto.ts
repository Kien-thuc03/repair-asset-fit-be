import { PartialType } from '@nestjs/mapped-types';
import { CreateTechnicianAssignmentDto } from './create-technician-assignment.dto';

export class UpdateTechnicianAssignmentDto extends PartialType(CreateTechnicianAssignmentDto) {}
