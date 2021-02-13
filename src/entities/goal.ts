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
export class Goal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 128, nullable: false })
  exercise: string;

  @Column("integer", { nullable: false, default: 0 })
  count: number;

  @Column("varchar", { length: 4, nullable: true })
  append: string;

  @Column("datetime", { nullable: true })
  deadline: Date;

  @Column("bool", { default: false })
  done: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.personalRecords)
  user: User;
}
