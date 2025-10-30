import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests = new Map<string, { count: number; resetTime: number }>();

  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const windowMs = this.configService.get('app.rateLimit.windowMs', 900000); // 15 minutes
    const maxRequests = this.configService.get('app.rateLimit.maxRequests', 100);
    const skipSuccessful = this.configService.get('app.rateLimit.skipSuccessfulRequests', false);

    const clientId = this.getClientId(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    this.cleanupOldEntries(windowStart);

    // Get or create client data
    let clientData = this.requests.get(clientId);
    if (!clientData || clientData.resetTime <= now) {
      clientData = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Check rate limit
    if (clientData.count >= maxRequests) {
      const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
        'Retry-After': retryAfter.toString(),
      });

      throw new HttpException(
        {
          message: 'Too many requests',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Increment counter
    clientData.count++;
    this.requests.set(clientId, clientData);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': (maxRequests - clientData.count).toString(),
      'X-RateLimit-Reset': new Date(clientData.resetTime).toISOString(),
    });

    // Handle response for skip successful requests
    if (skipSuccessful) {
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // Decrement counter for successful requests
          const currentData = this.requests.get(clientId);
          if (currentData && currentData.count > 0) {
            currentData.count--;
            this.requests.set(clientId, currentData);
          }
        }
        return originalSend.call(this, body);
      }.bind(this);
    }

    next();
  }

  private getClientId(req: Request): string {
    // Use IP address as client identifier
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded 
      ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
      : req.connection.remoteAddress || req.socket.remoteAddress;
    
    return ip || 'unknown';
  }

  private cleanupOldEntries(windowStart: number): void {
    for (const [clientId, data] of this.requests.entries()) {
      if (data.resetTime <= windowStart) {
        this.requests.delete(clientId);
      }
    }
  }
}
