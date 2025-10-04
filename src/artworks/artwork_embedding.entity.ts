import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";
import { Artwork } from "./artwork.entity";

@Entity({ name: "artwork_embeddings" })
export class ArtworkEmbedding {
  @PrimaryColumn({ type: "integer", name: "artwork_id" })
  artworkId!: number;

  @Column({ type: "simple-json", nullable: false })
  embedding!: number[];

  @Column({ type: "text", nullable: true })
  model?: string;

  @Column({ type: "text", nullable: true })
  phash?: string;

  @OneToOne(() => Artwork, { onDelete: "CASCADE" })
  @JoinColumn({ name: "artwork_id" })
  artwork!: Artwork;
}
