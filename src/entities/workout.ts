import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./user";
import { WorkoutDifficulty } from "./workoutDifficulty";
import { WorkoutType } from "./workoutType";
import { WorkoutDuration } from "./workoutDuration";
import { Like } from "./like";
import { Favorite } from "./favorite";

@Entity()
export class Workout {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  name: string;

  @Column("text")
  description: string;

  @ManyToOne(() => WorkoutType, (type) => type.workouts)
  type: WorkoutType;

  @ManyToOne(() => WorkoutDifficulty, (difficulty) => difficulty.workouts)
  difficulty: WorkoutDifficulty;

  @ManyToOne(() => WorkoutDuration, (difficulty) => difficulty.workouts)
  duration: WorkoutDuration;

  @Column("text")
  blocks: string;

  @Column("int")
  finishes: number;

  @Column("int")
  likes: number;

  @Column("int")
  views: number;

  @OneToMany(() => Like, (like) => like.workout)
  likeList: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.workout)
  favoriteList: Favorite[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.workouts)
  user: User;
}
