# 🚀 Resume Parser API v1.0.0

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://docker.com)
[![AI Powered](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge&logo=openai)](https://openai.com)

## 🌟 Overview

A **production-ready**, **AI-powered** Resume Parser API that transforms resumes into structured JSON data. Built with **complete flexibility** in mind - use any AI provider and define any response structure you want!

### 🎯 **Key Features**

- 🤖 **Multi-AI Support**: Google AI, OpenAI, Anthropic, Azure OpenAI
- 📐 **Dynamic Structure**: User-defined JSON response format
- 📄 **Multi-Format**: PDF, DOCX, TXT support
- 🏗️ **SOLID Architecture**: Modular, testable, maintainable
- 🐳 **Docker Ready**: Production containerization
- 🔒 **Enterprise Security**: Rate limiting, validation, error handling
- ⚡ **High Performance**: Optimized parsing and processing
- 📊 **Comprehensive Logging**: Winston with multiple transports
- ✅ **Full Testing**: Jest with mocks and integration tests

---

## 🚀 Quick Start

### **1. Clone & Install**
\`\`\`bash 
git clone https://github.com/rajibrjb/AiResumeParserApi.git
cd AiResumeParserApi
npm install
\`\`\`

### **2. Environment Setup**
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` with your AI provider credentials:
\`\`\`env
# Choose your AI provider
AI_PROVIDER=google  # google, openai, anthropic, azure

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Other settings
PORT=3000
MAX_FILE_SIZE=5242880
\`\`\`

### **3. Run**

**Development:**
\`\`\`bash
npm run dev
\`\`\`

**Production:**
\`\`\`bash
npm run build
npm start
\`\`\`

**Docker:**
\`\`\`bash
docker-compose up --build
\`\`\`

---

## 🎯 API Usage

### **Default Structure Parsing**
\`\`\`bash
curl -X POST http://localhost:3000/api/v1/resume/parse \\
  -F "resume=@path/to/resume.pdf"
\`\`\`

### **Custom Structure Parsing** ⭐
Define YOUR own response format:
\`\`\`bash
curl -X POST http://localhost:3000/api/v1/resume/parse \\
  -F "resume=@resume.pdf" \\
  -F 'customStructure={
    "candidate": {
      "name": "",
      "email": "",
      "phone": ""
    },
    "experience": [
      {
        "company": "",
        "role": "",
        "years": ""
      }
    ],
    "skills": "",
    "summary": ""
  }'
\`\`\`

**Response will match your exact structure!**

---

## 📋 Complete API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| \`POST\` | \`/api/v1/resume/parse\` | Parse resume with optional custom structure |
| \`GET\` | \`/api/v1/resume/structure\` | Get default structure template |
| \`GET\` | \`/api/v1/resume/formats\` | Get supported file formats |
| \`GET\` | \`/api/v1/resume/fields\` | Get available parsing fields |
| \`GET\` | \`/api/v1/resume/test\` | Test AI connectivity |
| \`GET\` | \`/api/v1/resume/provider\` | Get AI provider information |
| \`GET\` | \`/health\` | Health check |
| \`GET\` | \`/health/ready\` | Readiness check |

---

## 🤖 AI Provider Support

### **Google AI (Gemini)** 🟢
\`\`\`env
AI_PROVIDER=google
GOOGLE_AI_API_KEY=your_key_here
GOOGLE_AI_MODEL=gemini-2.0-flash
\`\`\`

### **OpenAI (GPT)** 🟢
\`\`\`env
AI_PROVIDER=openai
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4
\`\`\`

### **Anthropic (Claude)** 🟢
\`\`\`env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
\`\`\`

### **Azure OpenAI** 🟢
\`\`\`env
AI_PROVIDER=azure
AZURE_OPENAI_API_KEY=your_key_here
AZURE_OPENAI_ENDPOINT=your_endpoint_here
AZURE_OPENAI_DEPLOYMENT=your_deployment_name
\`\`\`

---

## 🏗️ Architecture
The project follows a clean and modular structure based on SOLID principles, ensuring maintainability, scalability, and ease of testing.
<details>
<summary>📁 Project Structure</summary>
src/
├── config/                      # Configuration management
├── controllers/                 # Request handlers
├── interfaces/                  # TypeScript interfaces
├── middleware/                  # Express middleware
├── routes/                      # API routes
├── services/                    # Business logic
│   ├── ai/                     # AI service implementations
│   │   ├── base/               # Base AI parser class
│   │   └── providers/          # Specific AI providers
│   └── documentProcessor.service.ts
├── types/                       # TypeScript type definitions
├── utils/                       # Utility functions
└── tests/                       # Test files

</details>

---

## 🧪 Testing

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage

# Lint code
npm run lint

# Type check
npm run type-check
\`\`\`

---

## 🐳 Docker Deployment

### **Docker Compose** (Recommended)
\`\`\`bash
docker-compose up --build
\`\`\`

### **Manual Docker**
\`\`\`bash
# Build image
docker build -t AiResumeParserApi .

# Run container
docker run -p 3000:3000 --env-file .env AiResumeParserApi
\`\`\`

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🌟 Star this repo if you found it helpful!

[![GitHub stars](https://img.shields.io/github/stars/rajibrjb/AiResumeParserApi?style=social)](https://github.com/rajibrjb/AiResumeParserApi/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/rajibrjb/AiResumeParserApi?style=social)](https://github.com/rajibrjb/AiResumeParserApi/network/members)

</div>