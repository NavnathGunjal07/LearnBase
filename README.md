# Learnbase - AI-Powered Learning Platform

A modern, interactive learning platform that provides personalized coding education through AI-powered tutoring and structured learning paths.

## 🚀 Features

- **Interactive AI Tutor**: Real-time chat with an AI coding tutor powered by OpenAI
- **Structured Learning Paths**: Organized topics and subtopics with progress tracking
- **Real-time Streaming**: Live message streaming for natural conversation flow
- **Progress Tracking**: Visual progress indicators and completion tracking
- **Responsive Design**: Modern, mobile-friendly interface built with React and Tailwind CSS
- **WebSocket Communication**: Real-time bidirectional communication between frontend and backend

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks for local state
- **WebSocket**: Native WebSocket API for real-time communication
- **Build Tool**: Vite for fast development and building

### Backend (Python + FastAPI)
- **Framework**: FastAPI for high-performance API
- **WebSocket**: Native WebSocket support for real-time communication
- **AI Integration**: OpenAI API for intelligent tutoring
- **Environment**: Python virtual environment with dependency management

## 📁 Project Structure

```
learnbase/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Chat/        # Chat-related components
│   │   │   ├── Loader.tsx   # Loading component
│   │   │   ├── Navbar.tsx   # Navigation bar
│   │   │   └── Sidebar.tsx  # Sidebar navigation
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useChat.ts   # Chat functionality hook
│   │   │   └── useLearning.ts # Learning state hook
│   │   ├── services/        # API services
│   │   │   └── api.ts       # API client
│   │   ├── utils/           # Utility functions
│   │   │   └── types.ts     # TypeScript type definitions
│   │   └── main.tsx         # Application entry point
│   ├── package.json         # Frontend dependencies
│   └── vite.config.ts       # Vite configuration
├── backend/                  # Python backend application
│   ├── app/
│   │   ├── routers/         # API route handlers
│   │   │   ├── ws.py        # WebSocket endpoints
│   │   │   ├── exercise.py  # Exercise management
│   │   │   ├── progress.py  # Progress tracking
│   │   │   └── validate.py  # Validation endpoints
│   │   ├── services/        # Business logic services
│   │   │   ├── generator.py # Content generation
│   │   │   └── validator.py # Validation logic
│   │   ├── models/          # Data models
│   │   │   └── schemas.py   # Pydantic schemas
│   │   ├── storage/         # Data storage
│   │   │   └── memory.py    # In-memory storage
│   │   └── main.py          # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables (create this)
├── .gitignore              # Git ignore rules
└── README.md               # Project documentation
```

## 🛠️ Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- OpenAI API key

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Create environment file**:
   Create a `.env` file in the `backend` directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

6. **Run the backend server**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:5173`

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
OPENAI_API_KEY=your_openai_api_key_here
```

#### Frontend (.env.local)
```env
VITE_WS_URL=ws://localhost:8000/ws
VITE_API_URL=http://localhost:8000
```

### API Endpoints

- **WebSocket**: `ws://localhost:8000/ws` - Real-time chat communication
- **REST API**: `http://localhost:8000` - Standard HTTP endpoints
- **API Documentation**: `http://localhost:8000/docs` - Interactive API docs

## 🚀 Usage

1. **Start Learning**: Select a topic and subtopic from the sidebar
2. **Chat with AI Tutor**: Type your questions or requests in the chat input
3. **Track Progress**: Monitor your learning progress with visual indicators
4. **Mark Completion**: Use the completion buttons to update your progress

## 🧪 Development

### Running Tests
```bash
# Backend tests
cd backend
python -m pytest

# Frontend tests
cd frontend
npm test
```

### Building for Production
```bash
# Frontend build
cd frontend
npm run build

# Backend (no build step needed)
cd backend
pip install -r requirements.txt
```

## 📦 Dependencies

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite

### Backend
- FastAPI
- OpenAI
- Pydantic
- WebSockets
- python-dotenv

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/learnbase/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 🔮 Future Enhancements

- [ ] User authentication and profiles
- [ ] Persistent data storage with database
- [ ] Multiple learning languages support
- [ ] Advanced progress analytics
- [ ] Collaborative learning features
- [ ] Mobile app development
- [ ] Offline learning capabilities

---

**Happy Learning! 🎓**
