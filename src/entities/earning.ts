import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
} from "typeorm";

@Entity()
export class Earning {
  @PrimaryGeneratedColumn("increment")
  id: string;

  @Column("varchar", { unique: true })
  month: string;

  @Column("float", { default: 0 })
  earnings: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
