Open Workshop07 folder in Intellij

# Turn on backend
run Main.java

# In the terminal
go to Workshop07 -> frontend
npm install react-icons
type npm run dev
     npm install react-credit-cards-2

Then the system should bring up a window with homepage

┌──────────────────────────┐
│  React + Vite (Frontend) │
│  runs in browser         │
│  localhost:5173          │
└────────────┬─────────────┘
              │ HTTP (JSON)
              ▼
┌──────────────────────────┐
│  Spring Boot (Backend)   │
│  runs on server/JVM      │
│  localhost:8080 / 8081   │
└──────────────────────────┘
REST APIs

# If port 5173 is in use, please run：
lsof -i :5173
kill -9 <PID>