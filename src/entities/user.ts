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

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("varchar", { unique: true, length: 128 })
  username: string;

  @Column("varchar", { select: false, length: 512 })
  password: string;

  @Column("varchar", { select: false, length: 128 })
  email: string;

  @Column("enum", {
    enum: ["free", "premium", "gifted_premium"],
    default: "free",
  })
  type: "free" | "premium" | "gifted_premium";

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Workout, (workout) => workout.user)
  workouts: Workout[];

  @OneToMany(() => Like, (like) => like.user)
  likeList: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favoriteList: Favorite[];

  @OneToMany(() => PersonalRecord, (pr) => pr.user)
  personalRecords: PersonalRecord[];
}
