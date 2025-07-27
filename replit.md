# Discord License Management Bot

## Overview

This is a Discord bot designed for license key management and user service validation. The bot provides commands to interact with a license management API, allowing users to generate keys, check user data, validate identifiers, and manage revenue modes through Discord chat commands.

**Current Status**: ✅ Bot is live and operational, successfully connected to Discord as "Comp hub bot#8077" and serving 1 Discord server.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend Architecture
- **Node.js Application**: Single-threaded event-driven architecture using Discord.js v14
- **Command Pattern**: Commands are handled through a centralized command handler that routes requests based on command names
- **API Client**: Uses Axios for HTTP communication with external license management API
- **Environment Configuration**: Uses dotenv for managing sensitive configuration like API keys and Discord tokens

### Frontend Architecture
- **Discord Interface**: The bot serves as the frontend, providing a chat-based interface for users
- **Command Prefix System**: All commands start with "!" prefix for easy identification
- **Real-time Interaction**: Immediate response to user commands through Discord's message system

## Key Components

### Main Application (`index.js`)
- **Discord Client Setup**: Configures bot with necessary intents for reading guild messages and message content
- **Event Handling**: Listens for ready events and message creation events
- **Command Parsing**: Extracts commands and arguments from Discord messages
- **Error Handling**: Comprehensive error logging and user feedback

### Command Handler (`commands.js`)
- **API Configuration**: Pre-configured Axios instance with base URL, timeout, and headers
- **Command Router**: Switch-case structure for handling different command types
- **Response Formatting**: Consistent embed-style formatting for bot responses
- **Error Management**: Standardized error message formatting and handling

### Available Commands
- `!help` - Display available commands and usage information
- `!userdata` - Retrieve current user information from the API
- `!revenuemode <service>` - Check revenue mode for a specific service
- `!checkidentifier <identifier>` - Validate service identifiers
- `!genkey [count] [note]` - Generate new license keys

## Data Flow

1. **User Input**: User sends a message with "!" prefix in Discord
2. **Command Parsing**: Bot extracts command name and arguments
3. **API Request**: Bot makes authenticated HTTP request to license management API
4. **Response Processing**: API response is formatted into user-friendly Discord message
5. **User Feedback**: Formatted response is sent back to the Discord channel

## External Dependencies

### Core Dependencies
- **discord.js (v14.21.0)**: Discord API wrapper for bot functionality
- **axios (v1.11.0)**: HTTP client for API communication
- **dotenv (v17.2.1)**: Environment variable management

### API Integration
- **License Management API**: External service at `https://pandadevelopment.net/api`
- **Authentication**: Bearer token authentication using API_KEY environment variable
- **Timeout Configuration**: 15-second timeout for API requests

### Environment Variables Required
- `DISCORD_TOKEN`: Bot token for Discord authentication
- `API_KEY`: API key for license management service authentication

## Deployment Strategy

### Configuration Requirements
- Node.js runtime environment
- Environment variables for API keys and tokens
- Network access to Discord API and license management API

### Error Handling Strategy
- **API Failures**: Graceful degradation with user-friendly error messages
- **Network Issues**: Timeout handling with clear feedback
- **Authentication Errors**: Specific messaging for configuration issues
- **Discord Errors**: Comprehensive logging for debugging

### Monitoring and Logging
- Console logging for bot startup and connection status
- Command execution logging with user identification
- Error logging for debugging and maintenance
- Warning system for Discord client issues

The architecture prioritizes simplicity and reliability, with a focus on providing a seamless user experience through Discord while maintaining secure communication with the license management backend.