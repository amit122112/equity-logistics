# Equity Logistics - Freight Calculator Application

A comprehensive logistics management system built with Next.js, featuring user authentication, shipment management, and admin controls.

## Features

### User Features
- **Authentication System**: Login, logout, forgot password with email verification
- **Dashboard**: Personal dashboard with shipment overview
- **Shipment Management**: Create, view, and track shipments
- **Profile Management**: Update personal information and settings
- **Notification Settings**: Customize notification preferences

### Admin Features
- **User Management**: Create, edit, delete, and manage user accounts
- **Quote Management**: View and manage shipment quote requests
- **Rate Management**: Manage carrier rates and pricing
- **Admin Dashboard**: Overview of system statistics and recent activities

### Technical Features
- **Session Management**: Automatic session timeout with warnings
- **Real-time Validation**: Email and phone number duplicate checking
- **Responsive Design**: Mobile-friendly interface
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Optimized loading states throughout the application

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Authentication**: JWT-based authentication
- **API**: RESTful API integration

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/equity-logistics.git
cd equity-logistics
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
Create a `.env.local` file in the root directory:

\`\`\`env
NEXT_PUBLIC_API_URL=https://hungryblogs.com/api
NEXT_PUBLIC_SESSION_TIMEOUT=120
NEXT_PUBLIC_REMEMBER_ME_DAYS=14
NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT=true
NEXT_PUBLIC_APP_NAME=Equity Logistics
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_ENABLE_LOGS=false
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

\`\`\`
├── app/                          # Next.js app directory
│   ├── admin/                    # Admin pages
│   │   ├── quotes/              # Quote management
│   │   ├── rates/               # Rate management
│   │   ├── settings/            # Admin settings
│   │   └── users/               # User management
│   ├── dashboard/               # User dashboard
│   │   ├── settings/            # User settings
│   │   ├── shipments/           # Shipment management
│   │   └── support/             # Support pages
│   ├── forgot-password/         # Password reset flow
│   ├── verify-reset-code/       # Code verification
│   └── types/                   # TypeScript type definitions
├── components/                   # Reusable components
│   ├── ui/                      # UI components
│   ├── AuthProvider.tsx         # Authentication context
│   ├── ShipmentForm.tsx         # Shipment creation form
│   └── UserForm.tsx             # User management form
├── contexts/                     # React contexts
├── hooks/                        # Custom React hooks
├── lib/                         # Utility functions
└── public/                      # Static assets
\`\`\`

## API Endpoints

### Authentication
- `POST /api/Login` - User login
- `POST /api/SendResetCode` - Send password reset code
- `POST /api/VerifyResetCode` - Verify reset code and update password

### User Management
- `GET /api/GetUsers` - Get all users (admin)
- `GET /api/GetUser` - Get user details
- `POST /api/CreateNewUser` - Create new user
- `POST /api/UpdateUser` - Update user information
- `POST /api/DeleteUser` - Delete user
- `POST /api/CheckEmail` - Check email availability
- `POST /api/CheckPhoneNumber` - Check phone number availability

### Shipments
- `GET /api/GetShipments` - Get user shipments
- `GET /api/GetShipment` - Get shipment details
- `POST /api/CalculateShipping` - Calculate shipping rates

### Carriers
- `GET /api/GetCarrier` - Get carrier rates

## Features in Detail

### Authentication System
- JWT-based authentication with refresh tokens
- Remember me functionality (14-day sessions)
- Automatic session timeout with warnings
- Password reset via email verification codes

### User Management
- Role-based access control (admin/user)
- Real-time validation for email and phone duplicates
- Comprehensive user profiles with address information
- Commission tracking for users

### Shipment Management
- Multi-item shipment creation
- Real-time shipping rate calculations
- Carrier comparison and selection
- Shipment tracking and history

### Admin Dashboard
- User management with search and filtering
- Quote request management
- Rate management for different carriers
- System statistics and monitoring

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API base URL | Required |
| `NEXT_PUBLIC_SESSION_TIMEOUT` | Session timeout in minutes | 120 |
| `NEXT_PUBLIC_REMEMBER_ME_DAYS` | Remember me duration | 14 |
| `NEXT_PUBLIC_ENABLE_SESSION_TIMEOUT` | Enable session timeout | true |
| `NEXT_PUBLIC_APP_NAME` | Application name | Equity Logistics |
| `NEXT_PUBLIC_APP_VERSION` | Application version | 1.0.0 |
| `NEXT_PUBLIC_ENABLE_LOGS` | Enable debug logs | false |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@equitylogistics.com or create an issue in this repository.
