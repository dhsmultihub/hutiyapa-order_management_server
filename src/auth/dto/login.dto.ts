import { IsString, IsNotEmpty, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({
        description: 'User email address',
        example: 'admin@hutiyapa.com'
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        description: 'User password',
        example: 'password123'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class LoginResponseDto {
    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'Token type',
        example: 'Bearer'
    })
    tokenType: string;

    @ApiProperty({
        description: 'Token expiration time in seconds',
        example: 604800
    })
    expiresIn: number;

    @ApiProperty({
        description: 'User information',
        example: { id: '1', email: 'admin@hutiyapa.com', roles: ['admin'] }
    })
    user: {
        id: string;
        email: string;
        roles: string[];
    };
}
