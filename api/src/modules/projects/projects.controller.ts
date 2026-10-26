import { Controller, Post, Body, Req, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { CreateProjectFacade } from './facade/create-project.facade';
import { CreateProjectRequest } from './dto/create-project.request';
import { CreateProjectResponse } from './dto/create-project.response';

@ApiTags('projects')
@Controller('v1/projects')
export class ProjectsController {
  constructor(private readonly createProjectFacade: CreateProjectFacade) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Criar novo projeto',
    description: 'Cria um novo projeto e devolve um token privado para acessá-lo. O token nunca é guardado no banco, apenas seu hash.',
  })
  @ApiResponse({
    status: 201,
    description: 'Projeto criado com sucesso',
    type: CreateProjectResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async create(
    @Body() request: CreateProjectRequest,
    @Req() req: Request,
  ): Promise<CreateProjectResponse> {
    const clientIp = (req.ip || '0.0.0.0').toString();

    return this.createProjectFacade.create({
      originalName: request.originalName,
      sizeBytes: request.sizeBytes,
      clientIp,
    });
  }
}
