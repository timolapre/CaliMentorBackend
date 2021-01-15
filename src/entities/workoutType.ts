import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Workout } from "./workout";

@Entity()
export class WorkoutType {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("text")
  text: string;

  @OneToMany(() => Workout, (workout) => workout.type)
  workouts: Workout[];
}