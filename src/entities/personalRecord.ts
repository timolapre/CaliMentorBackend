import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
  OneToMany,
  Unique,
} from "typeorm";
import { User } from "./user";
import { PersonalRecordHistory } from "./personalRecordHistory";

@Entity()
@Unique(["exercise", "append", "user"])
export class PersonalRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { length: 128, nullable: false })
  exercise: string;

  @Column("varchar", { length: 4, nullable: true })
  append: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.personalRecords)
  user: User;

  @OneToMany(() => PersonalRecordHistory, (history) => history.PersonalRecord)
  history: PersonalRecordHistory;
}
