import { Controller, Get, Res } from "@nestjs/common";
import type { Response } from "express";
import { MetricsService } from "./metrics.service";

@Controller()
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get("metrics")
  async metrics(@Res({ passthrough: true }) res: Response) {
    res.setHeader("Content-Type", this.metricsService.contentType);
    return this.metricsService.getMetrics();
  }
}
