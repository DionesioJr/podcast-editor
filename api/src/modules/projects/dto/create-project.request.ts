import { IsString, IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectRequest {
  @ApiProperty({
    description: 'Nome do vídeo original',
    example: 'meu_podcast_episodio_1.mp4',
  })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({
    description: 'Tamanho do vídeo em bytes',
    example: 524288000,
    minimum: 1,
    maximum: 2147483648,
  })
  @IsInt()
  @Min(1)
  @Max(2147483648)
  sizeBytes: number;
}
