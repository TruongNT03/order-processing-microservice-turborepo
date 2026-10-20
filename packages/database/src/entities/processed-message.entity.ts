import { Column, Entity, PrimaryColumn } from "typeorm";

export const TableName = "processed_messages";

@Entity(TableName)
export class ProcessedMessage {
  @PrimaryColumn()
  messageId: string;

  @Column()
  messageType: string | null;

  @Column()
  processedAt: Date;
}
