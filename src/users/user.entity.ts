import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "text", nullable: true })
  locale?: string;

  @Column({ type: "text", nullable: true })
  country?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
