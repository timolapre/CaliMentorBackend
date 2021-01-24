import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
  Column,
} from "typeorm";
import { User } from "./user";
import { Workout } from "./workout";

@Entity()
@Unique(["user", "workout"])
export class Like {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.likeList)
  user: User;

  @ManyToOne(() => Workout, (workout) => workout.likeList, {
    onDelete: "CASCADE",
  })
  workout: Workout;

  @Column("int")
  value: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
