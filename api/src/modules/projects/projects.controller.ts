import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  @Get('health')
  @ApiOperation({
    summary: 'Verificar disponibilidade do módulo projects',
    description: 'Retorna status do módulo projects com acesso a banco de dados',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulo projects está funcionando',
    schema: { example: { status: 'ok', module: 'projects' } },
  })
  health(): Record<string, string> {
    return { status: 'ok', module: 'projects' };
  }
}
