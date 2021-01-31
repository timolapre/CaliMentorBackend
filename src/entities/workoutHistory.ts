import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { Workout } from "./workout";
import { User } from "./user";

@Entity()
export class WorkoutHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.WorkoutHistory, {
    onDelete: "CASCADE",
  })
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.WorkoutHistory, {
    onDelete: "CASCADE",
  })
  workout: Workout;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
