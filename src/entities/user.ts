import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Workout } from "./workout";
import { Like } from "./like";
import { Favorite } from "./favorite";
import { PersonalRecord } from "./personalRecord";
import { WorkoutHistory } from "./workoutHistory";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { unique: true, length: 128 })
  username: string;

  @Column("varchar", {
    select: false,
    length: 512,
    nullable: true,
    default: null,
  })
  password: string;

  @Column("varchar", { select: false, length: 128 })
  email: string;

  @Column("enum", {
    enum: ["free", "premium", "gifted_premium", "expired", "canceled"],
    default: "free",
  })
  type: "free" | "premium" | "gifted_premium" | "expired" | "canceled";

  @Column("bool", { default: false })
  dailyFinish: boolean;

  @Column("date", { nullable: true, default: null })
  premiumExpireDate: Date;

  @Column("enum", { enum: ["None", "Subscription", "Single"], default: "None" })
  paymentMethod: "None" | "Subscription" | "Single";

  @Column("varchar", {
    select: false,
    length: 128,
    default: null,
  })
  stripeCustomerId: string;

  @Column("varchar", {
    length: 1024,
    select: false,
    default: null,
    nullable: true,
  })
  accessToken: string;

  @Column("varchar", {
    length: 1024,
    select: false,
    default: null,
    nullable: true,
  })
  refreshToken: string;

  @Column("varchar", {
    length: 1024,
    select: false,
    default: null,
    nullable: true,
  })
  googleId: string;

  @Column("enum", { enum: ["email", "google", "facebook"] })
  loginType: "email" | "google" | "facebook";

  @Column("text", { nullable: true, default: null })
  routine: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Workout, (workout) => workout.user)
  workouts: Workout[];

  @OneToMany(() => WorkoutHistory, (history) => history.user)
  WorkoutHistory: WorkoutHistory[];

  @OneToMany(() => Like, (like) => like.user)
  likeList: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favoriteList: Favorite[];

  @OneToMany(() => PersonalRecord, (pr) => pr.user)
  personalRecords: PersonalRecord[];
}
