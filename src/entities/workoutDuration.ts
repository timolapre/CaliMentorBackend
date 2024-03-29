import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Workout } from "./workout";

@Entity()
export class WorkoutDuration {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("varchar", { length: 128 })
  text: string;

  @OneToMany(() => Workout, (workout) => workout.duration)
  workouts: Workout[];
}
