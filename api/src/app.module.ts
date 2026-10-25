import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FfmpegModule } from './modules/ffmpeg/ffmpeg.module';

@Module({
  imports: [ScheduleModule.forRoot(), FfmpegModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
