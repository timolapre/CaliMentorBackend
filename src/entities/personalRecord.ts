import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { User } from "./user";

@Entity()
export class PersonalRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text", { nullable: false })
  exercise: string;

  @Column("integer", { nullable: false, default: 0 })
  count: number;

  @Column("text", { default: "x", nullable: true })
  append: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.personalRecords)
  user: User;
}
