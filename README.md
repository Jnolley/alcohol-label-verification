# TTB Alcohol Label Verification Application

A web application for verifying alcohol beverage labels against Alcohol and Tobacco Tax and Trade Bureau (TTB) requirements using OCR technology.

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or higher
- npm 10.x or higher

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Jnolley/alcohol-label-verification.git
   cd alcohol-label-verification
   ```

2. **Install dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Run the application**
   ```bash
   # Terminal 1 - Start backend
   cd backend
   npm run dev

   # Terminal 2 - Start frontend
   cd frontend
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

## 📦 Project Structure

```
alcohol-label-verification/
├── frontend/          # Angular 19 application
├── backend/           # Node.js/Express API
├── docs/              # Documentation
├── test_images/       # Sample label images for testing
└── .github/          # GitHub Actions workflows
```

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm test                 # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run e2e              # Run Cypress E2E tests
```

### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage
npm run test:watch       # Run tests in watch mode
```

## 🚢 Deployment

This project uses Vercel for deployments:

- **QA Environment**: Auto-deploys on merge to `develop`
- **Production**: Manual deployment from `main` branch

For detailed deployment instructions, see [VERCEL_SETUP.md](./docs/VERCEL_SETUP.md)

## 📚 Documentation

- [Frontend Features](./docs/FRONTEND_FEATURES.md) - User-facing features
- [Frontend Architecture](./docs/FRONTEND_ARCHITECTURE.md) - Frontend structure
- [Backend Features](./docs/BACKEND_FEATURES.md) - API features
- [Backend Architecture](./docs/BACKEND_ARCHITECTURE.md) - Backend structure
- [Testing Strategy](./docs/TESTING_STRATEGY.md) - Testing approach
- [Deployment Guide](./docs/DEPLOYMENT.md) - Branching and deployment
- [Vercel Setup](./docs/VERCEL_SETUP.md) - Vercel deployment setup
- [Tech Stack](./docs/TECH_STACK.md) - Technologies used

## 🛠️ Tech Stack

**Frontend:**
- Angular 19
- TypeScript
- TailwindCSS
- NgRx Signals
- Jasmine/Karma (testing)
- Cypress (E2E testing)

**Backend:**
- Node.js
- Express 5
- TypeScript
- Tesseract.js (OCR)
- Jest (testing)

**Infrastructure:**
- Vercel (hosting)
- GitHub Actions (CI/CD)

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Create a Pull Request to `develop`

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for branching strategy.

## 📝 License

[Add your license here]

## 👥 Authors

[Add author information]
