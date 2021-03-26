import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  ManyToOne,
} from "typeorm";
import { Exercise } from "./exercise";

@Entity()
export class ExerciseLevel {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("varchar", { length: 128, unique: true })
  name: string;

  @Column("int")
  order: number;

  @Column("bool", { nullable: false, default: 0 })
  video: boolean;

  @Column("varchar", { default: "webp" })
  fileType: string;

  @Column("bool", { default: true })
  approved: boolean;

  @ManyToOne(() => Exercise, (exercise) => exercise.levels, {
    onDelete: "CASCADE",
  })
  exercise: Exercise;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
