# 🏗️ GrindMap – System Architecture

## 📐 Architecture Overview
GrindMap follows a client-server architecture with clear separation between frontend and backend.

Frontend (React)
↓ REST APIs
Backend (Node.js + Express)
↓
MongoDB

## 🎨 Frontend Responsibilities
- UI rendering
- Data visualization
- API consumption
- Demo mode handling

## 🔙 Backend Responsibilities
- API handling
- Data scraping & fetching
- Normalization
- Business logic

## 🔄 Data Flow
1. Frontend sends request
2. Backend fetches platform data
3. Data is normalized
4. Response sent to frontend
5. UI updates

## 🚀 Scalability
- Modular scrapers
- Easy platform addition
- REST APIs ready for expansion
