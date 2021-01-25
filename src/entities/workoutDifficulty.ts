import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Workout } from "./workout";

@Entity()
export class WorkoutDifficulty {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("varchar", {length: 128})
  text: string;

  @OneToMany(() => Workout, (workout) => workout.difficulty)
  workouts: Workout[];
}
