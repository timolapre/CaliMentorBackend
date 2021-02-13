import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Generated,
} from "typeorm";
import { Workout } from "./workout";

@Entity()
export class WorkoutType {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("varchar", { length: 128 })
  text: string;

  @Column("integer", { nullable: false, default: 999 })
  order: number;

  @OneToMany(() => Workout, (workout) => workout.type)
  workouts: Workout[];
}
