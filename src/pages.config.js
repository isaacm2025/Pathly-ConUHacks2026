import Home from './pages/Home';
import Index from './pages/Index';
import Landing from './pages/Landing';
import SignUp from './pages/SignUp';
import EmergencyContacts from './pages/EmergencyContacts';
import Profile from './pages/Profile';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Index": Index,
    "Landing": Landing,
    "SignUp": SignUp,
    "EmergencyContacts": EmergencyContacts,
    "Profile": Profile,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};