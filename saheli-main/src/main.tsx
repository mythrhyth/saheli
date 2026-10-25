import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "@/app/App"
import ErrorBoundary from "@/components/ErrorBoundary"
import "@/i18n"
import "@/styles/index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
