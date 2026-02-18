import {Routes, Route, Navigate, BrowserRouter} from "react-router-dom";
import MapPage from "./pages/MapPage";
import LostPage from "./pages/LostPage";
import AuthPage from "./pages/AuthPage";
import ItemFormPage from "./pages/ItemFormPage";
import ChatbotPage from "./pages/ChatbotPage";
import { AuthProvider } from "./context/AuthContext";

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Navigate to="/map" />} />
                    <Route path="/map" element={<MapPage />} />
                    <Route path="/lost" element={<LostPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/items/new" element={<ItemFormPage mode="create" />} />
                    <Route path="/items/:id/edit" element={<ItemFormPage mode="edit" />} />
                    <Route path="/chatbot" element={<ChatbotPage />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
