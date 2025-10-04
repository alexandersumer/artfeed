import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = Date.now();
    const request = context
      .switchToHttp()
      .getRequest<
        Request & { method: string; url: string; user?: { sub?: string } }
      >();
    const method = request.method;
    const url = request.url;
    const userId = request.user?.sub;

    return next.handle().pipe(
      tap({
        next: () => this.log(method, url, userId, started, "success"),
        error: (err: Error) =>
          this.log(method, url, userId, started, "error", err),
      }),
    );
  }

  private log(
    method: string,
    url: string,
    userId: string | undefined,
    started: number,
    outcome: "success" | "error",
    error?: Error,
  ) {
    const duration = Date.now() - started;
    if (outcome === "error" && error) {
      this.logger.error(
        `${method} ${url} (${duration}ms) user=${userId ?? "anonymous"} -> ${error.message}`,
      );
    } else {
      this.logger.log(
        `${method} ${url} (${duration}ms) user=${userId ?? "anonymous"}`,
      );
    }
  }
}
