import { UUID } from 'crypto';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'Users' })
export class Users {
  @PrimaryGeneratedColumn()
  id: UUID;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  platformRole: string;

  @Column()
  active: boolean;

  @Column()
  isCustomer: boolean;

  @Column()
  createdAt: Date;

  @Column()
  lastLoginAt: Date;
}
