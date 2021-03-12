import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  OneToMany,
} from "typeorm";
import { ExerciseLevel } from "./exerciseLevel";

@Entity()
export class Exercise {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("varchar", { length: 128, unique: true })
  name: string;

  @Column("bool", { nullable: false, default: 0 })
  video: boolean;

  @Column("varchar", { default: "webp" })
  fileType: string;

  @Column("bool", { default: false })
  approved: boolean;

  @Column("int", { default: 0 })
  type: number;

  @OneToMany(() => ExerciseLevel, (exlevel) => exlevel.exercise)
  levels: ExerciseLevel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
