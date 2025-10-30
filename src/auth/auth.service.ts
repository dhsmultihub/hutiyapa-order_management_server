import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto, LoginResponseDto } from './dto/login.dto';

interface SignInPayload {
    sub: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
}

// Mock user database for testing
const MOCK_USERS = [
    {
        id: '1',
        email: 'admin@hutiyapa.com',
        password: 'admin123',
        roles: ['admin', 'staff'],
        permissions: ['orders:read', 'orders:write', 'orders:delete', 'users:read']
    },
    {
        id: '2',
        email: 'staff@hutiyapa.com',
        password: 'staff123',
        roles: ['staff'],
        permissions: ['orders:read', 'orders:write']
    },
    {
        id: '3',
        email: 'user@hutiyapa.com',
        password: 'user123',
        roles: ['user'],
        permissions: ['orders:read']
    }
];

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = MOCK_USERS.find(u => u.email === email && u.password === password);
        if (user) {
            const { password: _, ...result } = user;
            return result;
        }
        return null;
    }

    async login(loginDto: LoginDto): Promise<LoginResponseDto> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload: SignInPayload = {
            sub: user.id,
            email: user.email,
            roles: user.roles,
            permissions: user.permissions
        };

        const accessToken = this.jwtService.sign(payload);
        const expiresIn = this.getTokenExpiration();

        return {
            accessToken,
            tokenType: 'Bearer',
            expiresIn,
            user: {
                id: user.id,
                email: user.email,
                roles: user.roles
            }
        };
    }

    signToken(payload: SignInPayload): string {
        return this.jwtService.sign(payload);
    }

    private getTokenExpiration(): number {
        const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d');

        // Convert to seconds
        if (expiresIn.endsWith('d')) {
            return parseInt(expiresIn) * 24 * 60 * 60;
        } else if (expiresIn.endsWith('h')) {
            return parseInt(expiresIn) * 60 * 60;
        } else if (expiresIn.endsWith('m')) {
            return parseInt(expiresIn) * 60;
        } else {
            return parseInt(expiresIn);
        }
    }
}
