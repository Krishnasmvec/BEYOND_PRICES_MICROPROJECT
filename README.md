# 🌱 (BEYOND PRICES) Harvest Profit & Logistics Planner 🚜

**An AI-Powered Market Intelligence & Predictive Logistics Platform for Agriculture**

Welcome to the **Harvest Profit & Logistics Planner**! This project is designed to bridge the gap between farmers and consumers using advanced AI, predictive analytics, and real-time market data.

---

## 🎯 The Problem

In the agricultural sector, farmers often struggle with:
1. **Unpredictable Market Prices:** Selling crops at the wrong time or in the wrong market leads to massive profit losses.
2. **Inefficient Logistics:** Lack of insight into supply chains and transportation costs.
3. **Consumer Disconnect:** Consumers want fresh, locally-sourced produce but lack the intelligence on where and when to buy.

## 💡 Our Solution

The Harvest Profit & Logistics Planner leverages the power of **Google GenAI (Gemini)** and real-time market data to provide:
- **For Farmers:** Strategic market analysis, price predictions, and optimal harvesting/logistics timelines.
- **For Consumers:** Regional market insights, seasonal produce availability, and smart purchasing recommendations.

---

## ✨ Key Features

### 👨‍🌾 Farmer Portal
- **Market Analysis Wizard:** Input crop details, current growth stage, and location to receive tailored insights.
- **Predictive Dashboards:** Visualized price trends (powered by Recharts) forecasting when to harvest for maximum profit.
- **Logistics Planner:** Insights into transportation and supply chain efficiency.

### 🛒 Consumer Portal
- **Regional Market Intelligence:** Search by location to see what's fresh and trending.
- **Smart Purchasing Decisions:** AI-driven recommendations on when and where to buy produce.
- **Popular & Recent Searches:** Quick access to frequently searched regions based on live data.

### 🌐 Global Features
- **Bilingual / Multi-language Support:** Built-in language switcher to cater to rural communities and diverse user bases.
- **Optimized for Low Bandwidth:** Code-splitting and lazy-loading of heavy dashboard components for fast loading on rural networks.

---

## 🛠️ Technology Stack

**Frontend:**
- **React 19** & **Vite:** Lightning-fast UI rendering and development.
- **Tailwind CSS v4:** Modern, utility-first styling for a beautiful, responsive, and accessible interface.
- **Recharts:** Dynamic charting and data visualization.
- **Lucide React:** Beautiful, consistent iconography.

**Backend & Data:**
- **Node.js & Express:** Robust backend server for API routing and data fetching.
- **Google GenAI (Gemini SDK):** Core engine for generating predictive models and consumer insights.
- **Supabase:** Fast, scalable database for storing market data and user interactions.

**Build & Tooling:**
- **TypeScript:** Strict type-checking across both client and server.
- **Concurrently:** Seamless monorepo-style local development (Client + Server).
- **Zod:** Schema validation for secure data handling.

---

## 🚀 How to Run Locally

### 1. Clone the repository
```bash
git clone <repository-url>
cd harvest-profit-and-logistics-planner
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory. You can use `.env.example` as a template.
```env
# Example .env variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_genai_api_key
```

### 4. Start the Development Server
This will start both the React frontend and the Express backend concurrently.
```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000

---

## 🏗️ Architecture overview
- `src/`: React frontend (components, services, i18n, types).
- `server/`: Express backend serving APIs and handling database/GenAI interactions.
- `shared/`: Shared TypeScript types between client and server for ultimate type safety.

---

## 🔮 Future Roadmap
- [ ] **SMS Integration:** Allow farmers without smartphones to receive AI market insights via SMS.
- [ ] **IoT Sensor Integration:** Pull real-time weather and soil data directly from farm sensors.
- [ ] **B2B Marketplace:** Connect farmers directly with wholesale buyers and restaurants.
- [ ] **Advanced Routing Algorithms:** Provide turn-by-turn logistics planning for produce transport.

---

*Made with ❤️ for Hackathon 2026*
