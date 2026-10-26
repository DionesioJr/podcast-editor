import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectResponse {
  @ApiProperty({
    description: 'UUID do projeto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Token aleatório de 256 bits em hexadecimal (entregue uma única vez)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1',
  })
  token: string;

  @ApiProperty({
    description: 'Tamanho de cada parte do upload em bytes',
    example: 8388608,
  })
  partSize: number;
}
