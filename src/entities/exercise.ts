import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";

@Entity()
export class Exercise {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("text", { unique: true })
  name: string;

  @Column("bool", { nullable: false, default: 0 })
  video: boolean;

  @Column("bool", { default: false })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
