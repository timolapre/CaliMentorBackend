import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { User } from "./user";
import { PersonalRecord } from "./personalRecord";

@Entity()
export class PersonalRecordHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("integer", { nullable: false, default: 0 })
  count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => PersonalRecord, (pr) => pr.history, { onDelete: "CASCADE" })
  PersonalRecord: PersonalRecord;
}
