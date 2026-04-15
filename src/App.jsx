import AppRouter from "./router/AppRouter";
import { BarberProvider } from "./context/BarberContext";

export default function App() {
  return (
    <BarberProvider>
      <AppRouter />
    </BarberProvider>
  );
}
