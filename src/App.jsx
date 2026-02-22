import {Routes, Route, Navigate, BrowserRouter} from "react-router-dom";
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
                    <Route path="/" element={<Navigate to="/items" />} />
                    <Route path="/items" element={<LostPage />} />
                    <Route path="/map" element={<Navigate to="/items" replace />} />
                    <Route path="/lost" element={<Navigate to="/items" replace />} />
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
