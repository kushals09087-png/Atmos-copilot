# Atmos Copilot 🚀

**The AI-Powered Weather Intelligence Dashboard**

Atmos Copilot is a next-generation weather platform that combines real-time meteorological data with cutting-edge AI to provide hyper-local, predictive weather insights. Whether you're planning your day, managing logistics, or staying ahead of severe weather, Atmos Copilot gives you the intelligence you need.

## ✨ Features

### 🧠 AI Weather Intelligence
- **AI-Powered Forecasts**: Advanced machine learning models to predict weather patterns with higher accuracy
- **Natural Language Queries**: Ask anything about the weather in plain English
- **Personalized Recommendations**: Get tailored advice based on your location and activity
- **Trend Analysis**: Understand how weather is evolving over time

### 🌦️ Real-Time Weather
- **Current Conditions**: Instant access to temperature, humidity, wind speed, and more
- **Hourly Forecast**: Detailed breakdown of the next 24 hours
- **7-Day Forecast**: Plan your week with confidence
- **Air Quality Monitoring**: Real-time AQI with health recommendations

### 📍 Advanced Mapping
- **Interactive Weather Map**: Visualize weather patterns across your area
- **Satellite View**: See cloud cover and precipitation in real-time
- **Temperature Overlay**: Understand temperature gradients at a glance
- **Alert Zones**: Get notified of approaching weather events

### 🔒 Secure & Personalized
- **User Authentication**: Secure login and account management
- **Location History**: Track weather patterns in your favorite places
- **Custom Alerts**: Set up notifications for specific conditions
- **Privacy-Focused**: Your data is protected with industry-standard security

## 🛠️ Tech Stack

### Frontend
- **React 19**: Fast, modern UI library
- **Vite**: Blazing-fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, open-source icons

### Backend
- **Express.js**: Robust Node.js framework
- **OpenWeatherMap API**: Reliable weather data source
- **Google Gemini API**: Advanced AI insights and natural language processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn
- API Keys: OpenWeatherMap API key, Google Gemini API key

### Installation

```bash
# Clone the repository
git clone https://github.com/kushals09087-png/Atmos-copilot.git
cd Atmos-copilot

# Install dependencies for both backend and frontend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Running Locally

```bash
# Start both backend and frontend with a single command
npm start
```

**Alternative: Individual Services**

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
Atmos-copilot/
├── backend/           # Express.js API server
│   ├── config/        # Configuration files
│   ├── controllers/   # Request handlers
│   ├── routes/        # API route definitions
│   └── utils/         # Utility functions (AI, weather)
├── frontend/          # React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API service layer
│   │   ├── utils/       # Helper functions
│   │   ├── App.jsx    # Main application component
│   │   └── index.jsx    # Entry point
│   ├── public/        # Static assets
│   └── vite.config.js # Vite configuration
├── scripts/           # Development scripts
└── README.md          # Project documentation
```

## 📡 API Endpoints

### Weather Endpoints
- `GET /api/weather/current/:location`: Get current weather
- `GET /api/weather/hourly/:location`: Get hourly forecast
- `GET /api/weather/weekly/:location`: Get 7-day forecast
- `GET /api/weather/air-quality/:location`: Get air quality data

### AI Endpoints
- `POST /api/ai/weather`: Ask AI about weather
- `GET /api/ai/recommendations/:location`: Get AI recommendations

### User Endpoints
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login user
- `GET /api/user/locations`: Get user's saved locations

## 🧪 Testing

```bash
# Run frontend tests
cd frontend
npm test

# Run backend tests (if available)
cd backend
npm test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👨‍💻 Developed By

**Kushal** - [GitHub Profile](https://github.com/kushals09087-png)