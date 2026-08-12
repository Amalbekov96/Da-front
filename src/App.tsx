import "./App.css";
import { BrokerCheckPanel } from "./components/BrokerCheckPanel";
import { HealthIndicator } from "./components/HealthIndicator";

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Dispatcher Assistant</h1>
        <HealthIndicator />
      </header>
      <main>
        <BrokerCheckPanel />
      </main>
    </div>
  );
}
